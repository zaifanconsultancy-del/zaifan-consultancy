import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Coins, Wallet } from "lucide-react";

import { countryIndex as countryList } from "../../../data/countries/countryIndex";
import { COUNTRY_TRAITS, TRAIT_LABELS } from "../../../data/countries/destinationProfiles";
import { FlagMark } from "../destinations/DestinationUI";

function Marquee({ items, reverse = false, duration }) {
  // Two copies side by side so the loop is seamless.
  const loop = [...items, ...items];
  return (
    <div className="zaifan-marquee-track overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className={`zaifan-marquee gap-3 ${reverse ? "zaifan-marquee-reverse" : ""}`} style={{ "--marquee-duration": `${duration}s` }}>
        {loop.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="shrink-0 whitespace-nowrap rounded-full bg-white/[0.06] px-4 py-2 text-xs font-black text-white/75 ring-1 ring-white/10"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function DestinationCard({ country, index }) {
  const [first, middle, last] = country.flagColors;
  const goodFor = (COUNTRY_TRAITS[country.slug] || []).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
    >
      <Link
        to={`/countries/${country.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-white p-6 text-[#071f50] shadow-[0_24px_60px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_34px_80px_rgba(255,75,18,0.28)]"
      >
        {/* Flag colours as a ribbon, and a soft glow on hover */}
        <span className="absolute inset-x-0 top-0 flex h-1.5">
          {[first, middle, last].map((color, stripe) => (
            <span key={stripe} className="flex-1" style={{ background: color === "#ffffff" ? "#e9edf3" : color }} />
          ))}
        </span>
        <span
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-0 blur-3xl transition duration-500 group-hover:opacity-40"
          style={{ background: last === "#ffffff" ? first : last }}
        />

        <div className="relative flex items-center justify-between">
          <FlagMark country={country} className="h-10 w-[60px] transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110" />
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fff1ea] text-[#ff4b12] transition group-hover:bg-[#ff4b12] group-hover:text-white">
            <ArrowUpRight size={18} strokeWidth={3} />
          </span>
        </div>

        <h3 className="relative mt-5 text-2xl font-black tracking-[-0.04em]">{country.name}</h3>
        <p className="relative mt-1.5 text-sm font-semibold leading-6 text-[#61708a]">{country.tagline}</p>

        <div className="relative mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-[#fff7ed] p-3 ring-1 ring-orange-100">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#7a879c]">
              <Wallet size={12} className="text-[#ff4b12]" /> Tuition
            </p>
            <p className="mt-1 text-sm font-black leading-5">{country.quickFacts.tuition}</p>
          </div>
          <div className="rounded-2xl bg-[#fff7ed] p-3 ring-1 ring-orange-100">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#7a879c]">
              <Coins size={12} className="text-[#ff4b12]" /> Living
            </p>
            <p className="mt-1 text-sm font-black leading-5">{country.quickFacts.living}</p>
          </div>
        </div>

        <div className="relative mt-auto flex flex-wrap items-center gap-1.5 pt-5">
          <span className="text-[11px] font-black text-[#7a879c]">Good for:</span>
          {goodFor.map((trait) => (
            <span key={trait} className="rounded-full bg-[#071f50] px-2.5 py-1 text-[10px] font-black text-white">
              {TRAIT_LABELS[trait]}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}

function DestinationCards({ universityNames }) {
  const half = Math.ceil(universityNames.length / 2);

  return (
    <section className="relative overflow-hidden bg-[#071f50] px-4 pb-16 pt-10 text-white sm:px-5 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-[#ff4b12]/15 blur-[120px]" />

      <div className="relative mx-auto max-w-[1350px]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
            Where would you <span className="text-[#ff7b1c]">like to study?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/70 md:text-base">
            Nine countries, with what each one costs and what it's good for. Tap any country to see its full guide.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {countryList.map((country, index) => (
            <DestinationCard key={country.slug} country={country} index={index} />
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link to="/countries" className="inline-flex items-center gap-2 text-sm font-black text-[#ffb36d] hover:text-white">
            Compare all nine side by side <ArrowRight size={15} strokeWidth={3} />
          </Link>
        </div>

        <div className="mt-14">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <p className="text-2xl font-black tracking-[-0.04em] md:text-3xl">
              <span className="text-[#ff7b1c]">{universityNames.length}</span> universities we can help you apply to
            </p>
            <Link to="/universities" className="inline-flex items-center gap-2 text-sm font-black text-[#ffb36d] hover:text-white">
              Search them all <ArrowRight size={15} strokeWidth={3} />
            </Link>
          </div>
          <div className="space-y-3">
            <Marquee items={universityNames.slice(0, half)} duration={half * 5} />
            <Marquee items={universityNames.slice(half)} duration={(universityNames.length - half) * 6} reverse />
          </div>
        </div>
      </div>
    </section>
  );
}

export default DestinationCards;
