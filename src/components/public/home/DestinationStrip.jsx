import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { countryList } from "../../../data/countries";
import { formatUsd } from "../../../data/countries/costs";
import { FlagMark } from "../destinations/DestinationUI";
import { SNAPSHOTS, firstPart } from "../countries/countriesData";

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

/**
 * Where you can go, in one glance: a small tile per country (the full
 * comparison lives on /countries) and every university we profile.
 */
function DestinationStrip({ universityNames }) {
  const half = Math.ceil(universityNames.length / 2);

  return (
    <section className="relative overflow-hidden bg-[#071f50] px-4 pb-20 pt-12 text-white sm:px-5 md:pb-28 md:pt-16">
      <div className="relative mx-auto max-w-[1350px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
            Nine countries.
            <span className="block text-[#ff7b1c]">Pick yours.</span>
          </h2>
          <Link
            to="/countries"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#071f50] transition hover:-translate-y-0.5 hover:bg-[#ffb36d]"
          >
            Compare them side by side <ArrowRight size={16} strokeWidth={3} />
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {countryList.map((country, index) => (
            <motion.div
              key={country.slug}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: (index % 3) * 0.06 }}
            >
              <Link
                to={`/countries/${country.slug}`}
                className="group flex h-full gap-4 rounded-[22px] bg-white/[0.06] p-4 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white hover:text-[#071f50] sm:p-5"
              >
                <FlagMark country={country} className="h-10 w-[60px] rounded-[7px] transition group-hover:-rotate-6" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-lg font-black leading-6 tracking-[-0.02em]">
                    {country.name}
                    <ArrowUpRight size={17} strokeWidth={3} className="shrink-0 text-[#ff7b1c] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#ff4b12]" />
                  </span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-white/60 group-hover:text-[#5f6f89]">{country.tagline}</span>
                  <span className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-black">
                    <span className="rounded-full bg-white/10 px-2.5 py-1 group-hover:bg-[#fff1ea] group-hover:text-[#ff4b12]">
                      1st year {formatUsd(SNAPSHOTS[country.slug].firstYear)}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 group-hover:bg-[#f3f5f8]">Starts {firstPart(country.quickFacts.intakes)}</span>
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-16">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <p className="text-xl font-black tracking-[-0.03em] md:text-2xl">
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

export default DestinationStrip;
