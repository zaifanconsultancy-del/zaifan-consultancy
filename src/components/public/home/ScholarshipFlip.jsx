import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Award, RefreshCw } from "lucide-react";

import { FlagMark } from "../destinations/DestinationUI";

function FlipCard({ item, index }) {
  const [flipped, setFlipped] = useState(false);
  const flip = () => setFlipped((current) => !current);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      className="h-[290px] [perspective:1400px]"
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`${item.name}: ${flipped ? "hide" : "show"} what it covers`}
        onClick={flip}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            flip();
          }
        }}
        className={`relative h-full w-full cursor-pointer rounded-[28px] outline-none transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d] focus-visible:ring-4 focus-visible:ring-[#ffb36d] ${
          flipped ? "[transform:rotateY(180deg)]" : "hover:[transform:rotateY(-8deg)_translateY(-4px)]"
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 flex flex-col rounded-[28px] bg-white/[0.06] p-6 ring-1 ring-white/12 [backface-visibility:hidden]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FlagMark country={item.country} className="h-7 w-[42px]" />
              <span className="text-sm font-black text-white/70">{item.country.name}</span>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ff4b12] text-white">
              <Award size={19} />
            </span>
          </div>
          <h3 className="mt-6 text-2xl font-black leading-7 tracking-[-0.04em] text-white">{item.name}</h3>
          <p className="mt-2 text-xs font-bold leading-5 text-white/55">{item.provider}</p>
          <div className="mt-auto flex items-center justify-between">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#ffb36d]">{item.level}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-white/70">
              <RefreshCw size={13} /> Tap to flip
            </span>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col rounded-[28px] bg-gradient-to-br from-[#ff7b1c] to-[#ff4b12] p-6 text-white shadow-[0_30px_70px_rgba(255,75,18,0.35)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/75">What it covers</p>
          <p className="mt-2 text-xl font-black leading-7 tracking-[-0.03em]">{item.covers}</p>
          {item.note && <p className="mt-3 line-clamp-3 text-xs font-semibold leading-5 text-white/85">{item.note}</p>}
          <div className="mt-auto flex items-center justify-between gap-3">
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#071f50] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0b2a6b]"
              >
                Official page <ArrowUpRight size={13} strokeWidth={3} />
              </a>
            ) : (
              <Link
                to={`/countries/${item.country.slug}`}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#071f50] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0b2a6b]"
              >
                {item.country.name} guide <ArrowUpRight size={13} strokeWidth={3} />
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-white/80">
              <RefreshCw size={13} /> Flip back
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ScholarshipFlip({ scholarships }) {
  return (
    <section className="relative overflow-hidden bg-[#071f50] px-4 pb-16 pt-10 text-white sm:px-5 md:pb-24 md:pt-14">
      <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-[#ff4b12]/15 blur-[120px]" />

      <div className="relative mx-auto max-w-[1350px]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
            Scholarships that could <span className="text-[#ff7b1c]">pay for your degree.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/70 md:text-base">
            One big funding route in every country. Tap a card to see what it covers.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {scholarships.map((item, index) => (
            <FlipCard key={item.name} item={item} index={index} />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <Link
            to="/scholarships"
            className="inline-flex items-center gap-2 rounded-full bg-[#ff4b12] px-7 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
          >
            See every scholarship <ArrowRight size={17} strokeWidth={3} />
          </Link>
          <p className="max-w-lg text-xs font-semibold text-white/50">
            Rules and deadlines change every year. We check the current call for you before you apply.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ScholarshipFlip;
