import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, ChevronRight, Clock3, PlaneLanding } from "lucide-react";

import { FlagMark } from "../destinations/DestinationUI";
import { formatMonth, mainIntakeMonth, upcomingIntakes } from "./guideDates";

const PAKISTAN_OFFSET = 5 * 60;

// Minutes ahead of UTC in a time zone right now (handles summer time).
function offsetMinutes(zone, date) {
  const label =
    new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value || "GMT";
  const match = label.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!match) return 0;
  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] || 0));
}

function versusPakistan(zone, date) {
  const hours = (offsetMinutes(zone, date) - PAKISTAN_OFFSET) / 60;
  if (hours === 0) return "Same time as Pakistan";
  const amount = Math.abs(hours);
  return `${amount} hour${amount === 1 ? "" : "s"} ${hours > 0 ? "ahead of" : "behind"} Pakistan`;
}

function useNow(interval = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), interval);
    return () => window.clearInterval(timer);
  }, [interval]);
  return now;
}

function scrollToStep(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** A postcard from the destination, postmarked today, with its live local time. */
function Postcard({ country, now }) {
  const { photo, clock } = country;
  const postmark = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <motion.figure
        initial={{ opacity: 0, y: 40, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-[10px] bg-white p-3 pb-4 shadow-[0_30px_70px_rgba(7,31,80,0.18)] ring-1 ring-[#071f50]/5 sm:p-4 sm:pb-5"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-[#dfe4ec]">
          {photo && <img src={photo.src} alt={photo.caption} className="h-full w-full object-cover" fetchPriority="high" />}
          {/* Postmark, dated today */}
          <div className="absolute bottom-3 left-3 grid h-[92px] w-[92px] -rotate-12 place-items-center rounded-full border-[3px] border-dashed border-white/90 text-center text-white [text-shadow:0_1px_6px_rgba(7,31,80,0.6)]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em]">{photo?.place || country.name}</p>
              <p className="mt-0.5 font-mono text-[9px] font-black">{postmark}</p>
            </div>
          </div>
        </div>
        <figcaption className="mt-3 flex items-end justify-between gap-3 px-1">
          <div>
            <p className="text-lg font-black italic tracking-[-0.03em] text-[#071f50] sm:text-xl">Greetings from {country.name}!</p>
            <p className="text-xs font-bold text-[#7a879c]">{photo?.caption}</p>
          </div>
          {photo?.credit && (
            <a
              href={photo.source}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-right text-[10px] font-bold leading-4 text-[#9aa5b8] hover:text-[#ff4b12]"
            >
              Photo: {photo.credit}
              <br />
              {photo.license}
            </a>
          )}
        </figcaption>

        {/* Stamp */}
        <div className="absolute -right-3 -top-4 rotate-6 rounded-[6px] border-2 border-dashed border-[#071f50]/25 bg-white p-1.5 shadow-lg sm:-right-5">
          <div className="grid place-items-center gap-1 rounded-[3px] bg-[#fff7ed] px-3 py-2">
            <FlagMark country={country} className="h-7 w-[42px]" />
            <span className="font-mono text-[10px] font-black text-[#071f50]">{country.code}</span>
          </div>
        </div>
      </motion.figure>

      {clock && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="relative -mt-5 ml-auto mr-2 flex w-fit items-center gap-3 rounded-2xl bg-[#071f50] px-4 py-3 text-white shadow-[0_20px_40px_rgba(7,31,80,0.3)] sm:mr-6"
        >
          <Clock3 size={20} className="shrink-0 text-[#ffb36d]" />
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white/60">Right now in {clock.city}</p>
            <p className="text-lg font-black leading-tight">
              {now.toLocaleTimeString("en-GB", { timeZone: clock.zone, hour: "2-digit", minute: "2-digit" })}
              <span className="ml-2 text-xs font-bold text-white/70">{versusPakistan(clock.zone, now)}</span>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function GuideHero({ country, appointmentPath }) {
  const now = useNow();
  const facts = country.quickFacts;
  const { suggested } = upcomingIntakes(facts.intakes, now);

  const tiles = [
    { label: "Tuition", value: facts.tuition },
    { label: "Living", value: facts.living },
    { label: "Main intake", value: formatMonth(mainIntakeMonth(facts.intakes), false), note: facts.intakes },
    { label: "After you graduate", value: facts.postStudy },
  ];

  return (
    <section className="relative overflow-hidden bg-[#fff7ed] px-4 pb-16 pt-28 text-[#071f50] sm:px-5 md:pb-24 md:pt-36">
      {/* Faint flight path behind everything */}
      <svg aria-hidden="true" className="pointer-events-none absolute -right-20 top-24 hidden h-[520px] w-[900px] text-[#071f50]/[0.07] lg:block" viewBox="0 0 900 520" fill="none">
        <path d="M10 500 C 260 420, 380 80, 880 30" stroke="currentColor" strokeWidth="3" strokeDasharray="10 14" />
      </svg>

      <div className="relative mx-auto grid max-w-[1350px] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-black text-[#7a879c]">
            <Link to="/countries" className="hover:text-[#ff4b12]">
              Countries
            </Link>
            <ChevronRight size={13} />
            <span className="text-[#071f50]">{country.name}</span>
          </nav>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-3.5 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white">
              <PlaneLanding size={14} className="text-[#ffb36d]" /> Arrivals · {country.code}
            </span>
            <span className="rounded-full bg-white px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#ff4b12] ring-1 ring-orange-100">
              {country.region}
            </span>
            {country.inEU && (
              <span className="rounded-full bg-[#003399] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#ffcc00]">EU · Schengen</span>
            )}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-6 text-[3.4rem] font-black leading-[0.86] tracking-[-0.07em] sm:text-7xl xl:text-[104px]"
          >
            Study in
            <span className="block text-[#ff4b12]">{country.name}.</span>
          </motion.h1>

          <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-[#526178] sm:text-lg">{country.intro}</p>

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
              Book a free {country.name} plan
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

          {suggested && (
            <p className="mt-4 text-sm font-bold text-[#526178]">
              Starting from today, your realistic start is{" "}
              <span className="font-black text-[#071f50]">{formatMonth(suggested.index)}</span> ({suggested.monthsAway} months away).{" "}
              <button type="button" onClick={() => scrollToStep("apply")} className="font-black text-[#ff4b12] underline-offset-4 hover:underline">
                See every step in real months
              </button>
            </p>
          )}
        </div>

        <Postcard country={country} now={now} />
      </div>
    </section>
  );
}

export default GuideHero;
