import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, ChevronRight, Clock3, MapPin } from "lucide-react";

import { FlagMark } from "../destinations/DestinationUI";
import CampusPhoto from "../universities/CampusPhoto";
import { moneyRange } from "../guide/guideSteps";
import { useNow, versusPakistan } from "../guide/localTime";

function scrollToStep(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** A luggage tag for the city: a campus photo (when we have one), the flag and the live local time. */
function LuggageTag({ city, country, now }) {
  const campus = city.photoUniversity;
  const zone = country.clock?.zone;

  return (
    <div className="relative mx-auto w-full max-w-[460px] px-2 pt-10 sm:px-0">
      {/* The string the tag hangs from */}
      <svg aria-hidden="true" viewBox="0 0 120 80" className="absolute left-1/2 top-0 h-[74px] w-[110px] -translate-x-1/2 text-[#071f50]/40" fill="none">
        <path d="M60 78 C 20 50, 10 10, 60 6 C 110 10, 100 50, 60 78" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 40, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: 2 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "50% 0%" }}
        className="relative rounded-[28px] bg-white p-4 shadow-[0_30px_70px_rgba(7,31,80,0.18)] ring-1 ring-[#071f50]/5"
      >
        {/* The punched hole */}
        <div className="mx-auto mb-3 h-5 w-5 rounded-full bg-[#fff7ed] ring-[3px] ring-[#071f50]/15" />

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#071f50] px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">Destination</p>
            <p className="truncate text-2xl font-black tracking-[-0.04em]">{city.name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-3xl" aria-hidden="true">
              {city.emoji}
            </span>
            <FlagMark country={country} className="h-7 w-[42px]" />
          </div>
        </div>

        {campus ? (
          <div className="mt-3">
            <CampusPhoto university={campus} className="aspect-[16/10] rounded-2xl" credit eager />
            <p className="mt-2 px-1 text-xs font-bold text-[#7a879c]">
              {campus.name}, {city.name}
            </p>
          </div>
        ) : (
          <div className="mt-3 grid aspect-[16/8] place-items-center rounded-2xl bg-[#fff1ea] bg-[repeating-linear-gradient(135deg,rgba(255,75,18,0.07)_0_14px,transparent_14px_28px)]">
            <span className="text-7xl" aria-hidden="true">
              {city.emoji}
            </span>
          </div>
        )}

        <dl className="mt-3 grid grid-cols-2 gap-2 border-t-2 border-dashed border-[#071f50]/10 pt-3">
          <div className="rounded-xl bg-[#fff7ed] px-3 py-2.5">
            <dt className="font-mono text-[9.5px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">Region</dt>
            <dd className="mt-0.5 text-sm font-black leading-5 text-[#071f50]">{city.region || country.name}</dd>
          </div>
          <div className="rounded-xl bg-[#fff7ed] px-3 py-2.5">
            <dt className="font-mono text-[9.5px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">Best known for</dt>
            <dd className="mt-0.5 text-sm font-black leading-5 text-[#071f50]">{city.bestFor.slice(0, 2).join(" · ")}</dd>
          </div>
        </dl>
      </motion.div>

      {zone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="relative mt-5 ml-2 flex w-fit items-center gap-3 rounded-2xl bg-[#071f50] px-4 py-3 text-white shadow-[0_20px_40px_rgba(7,31,80,0.3)] sm:ml-0"
        >
          <Clock3 size={20} className="shrink-0 text-[#ffb36d]" />
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white/60">Right now in {city.name}</p>
            <p className="text-lg font-black leading-tight">
              {now.toLocaleTimeString("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit" })}
              <span className="ml-2 text-xs font-bold text-white/70">{versusPakistan(zone, now)}</span>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function CityHero({ city, country, universities, appointmentPath }) {
  const now = useNow();
  const symbol = country.currencySymbol || "";

  const tiles = [
    { label: "A month costs", value: city.totals ? moneyRange(symbol, city.totals.low, city.totals.high) : city.livingCost, note: "Rent, food, transport and everyday costs" },
    { label: "Cost level", value: city.livingCost },
    { label: "Universities here", value: universities.length ? `${universities.length} with a full profile` : "Ask us" },
    { label: "Part-time work", value: country.quickFacts.work },
  ];

  return (
    <section className="relative overflow-hidden bg-[#fff7ed] px-4 pb-16 pt-28 text-[#071f50] sm:px-5 md:pb-24 md:pt-36">
      <div className="relative mx-auto grid max-w-[1350px] items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-black text-[#7a879c]">
            <Link to="/countries" className="hover:text-[#ff4b12]">
              Countries
            </Link>
            <ChevronRight size={13} />
            <Link to={`/countries/${country.slug}`} className="hover:text-[#ff4b12]">
              {country.name}
            </Link>
            <ChevronRight size={13} />
            <span className="text-[#071f50]">{city.name}</span>
          </nav>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-3.5 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white">
              <MapPin size={14} className="text-[#ffb36d]" /> City guide · {country.name}
            </span>
            {city.region && city.region !== city.name && (
              <span className="rounded-full bg-white px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#ff4b12] ring-1 ring-orange-100">{city.region}</span>
            )}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-6 text-[3.4rem] font-black leading-[0.86] tracking-[-0.07em] sm:text-7xl xl:text-[104px]"
          >
            Living in
            <span className="block text-[#ff4b12]">{city.name}.</span>
          </motion.h1>

          <p className="mt-6 max-w-xl text-xl font-black leading-7 tracking-[-0.02em]">{city.headline}</p>
          {city.intro && <p className="mt-3 max-w-xl text-base font-semibold leading-8 text-[#526178]">{city.intro}</p>}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => scrollToStep("fit")}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-7 py-4 text-sm font-black text-white transition hover:bg-[#0b2a6b]"
            >
              Start step 1: is it for me?
              <ArrowDown size={17} strokeWidth={3} className="transition group-hover:translate-y-0.5" />
            </button>
            <Link
              to={appointmentPath}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-7 py-4 text-sm font-black text-white shadow-[0_16px_36px_rgba(255,75,18,0.3)] transition hover:bg-[#ff642f]"
            >
              Book a free {city.name} plan
              <ArrowRight size={17} strokeWidth={3} />
            </Link>
          </div>

          <dl className="mt-9 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-2xl bg-white p-3.5 ring-1 ring-orange-100" title={tile.note}>
                <dt className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#ff4b12]">{tile.label}</dt>
                <dd className="mt-1.5 text-sm font-black leading-5">{tile.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <LuggageTag city={city} country={country} now={now} />
      </div>
    </section>
  );
}

export default CityHero;
