import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, Hand, Search } from "lucide-react";

import { allUniversities } from "../../../data/universities";
import { countryList, getCountryBySlug } from "../../../data/countries/countryRegistry";
import { FlagMark } from "../destinations/DestinationUI";
import CampusPhoto from "./CampusPhoto";
import { HUB_STEPS } from "./hubSteps";

// Famous campuses pinned to the board, one per country where we have a photo.
const PIN_SLUGS = ["university-of-bologna", "tum", "sorbonne-universite", "ku-leuven", "bogazici-university", "tsinghua-university", "babes-bolyai", "vilnius-university", "rmit-vietnam"];
const PIN_SPOTS = [
  { left: "2%", top: "4%", rotate: -7 },
  { left: "36%", top: "0%", rotate: 4 },
  { left: "66%", top: "6%", rotate: -3 },
  { left: "6%", top: "48%", rotate: 5 },
  { left: "40%", top: "44%", rotate: -5 },
  { left: "70%", top: "52%", rotate: 6 },
];
const QUICK_SEARCHES = ["Medicine", "Computer science", "Engineering", "Business", "Design", "Milan", "Berlin"];

function Polaroid({ university, spot, boardRef, index }) {
  const country = getCountryBySlug(university.countrySlug);
  const [dragging, setDragging] = useState(false);

  return (
    <motion.div
      drag
      dragConstraints={boardRef}
      dragElastic={0.15}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setTimeout(() => setDragging(false), 0)}
      initial={{ opacity: 0, y: -40, rotate: spot.rotate * 2 }}
      animate={{ opacity: 1, y: 0, rotate: spot.rotate }}
      transition={{ type: "spring", stiffness: 160, damping: 16, delay: 0.15 + index * 0.08 }}
      whileHover={{ scale: 1.04, rotate: 0, zIndex: 30 }}
      whileDrag={{ scale: 1.08, rotate: 0, zIndex: 40, cursor: "grabbing" }}
      className="absolute w-[30%] min-w-[150px] max-w-[220px] cursor-grab touch-none"
      style={{ left: spot.left, top: spot.top }}
    >
      {/* Tape strip */}
      <span className="absolute -top-3 left-1/2 z-10 h-6 w-16 -translate-x-1/2 rotate-[-4deg] bg-[#ffb36d]/70 shadow-sm" />
      <Link
        to={university.path}
        draggable={false}
        onClick={(event) => dragging && event.preventDefault()}
        className="block rounded-[6px] bg-white p-2.5 pb-3 shadow-[0_18px_40px_rgba(7,31,80,0.18)]"
      >
        <CampusPhoto university={university} size="small" eager className="aspect-[4/3] rounded-[3px]" imgClassName="pointer-events-none select-none" />
        <span className="mt-2 flex items-center gap-1.5">
          <FlagMark country={country} className="h-3 w-[18px] shrink-0 rounded-[2px] shadow-none" />
          <span className="truncate text-[12px] font-black leading-4 text-[#071f50]">{university.name.replace(/\s*\(.*\)/, "")}</span>
        </span>
        <span className="mt-0.5 block truncate pl-[24px] text-[10px] font-bold text-[#7a879c]">{university.city}</span>
      </Link>
    </motion.div>
  );
}

/** Hero: a big search box next to a board of real campus photos you can drag around. */
function PinboardHero({ onSearch }) {
  const boardRef = useRef(null);
  const [term, setTerm] = useState("");

  const pins = PIN_SLUGS.map((slug) => allUniversities.find((university) => university.slug === slug))
    .filter((university) => university?.photo)
    .slice(0, PIN_SPOTS.length);

  const submit = (event) => {
    event.preventDefault();
    onSearch(term.trim());
  };

  return (
    <section className="relative overflow-hidden bg-[#fff7ed] px-4 pb-16 pt-28 text-[#071f50] sm:px-5 md:pb-24 md:pt-36">
      {/* Cork-board dots */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(7,31,80,0.07)_1.2px,transparent_1.2px)] [background-size:22px_22px]" />

      <div className="relative mx-auto grid max-w-[1350px] items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.14em]">
            {HUB_STEPS.map((step, index) => (
              <li key={step.id} className="flex items-center gap-2">
                <a href={`#${step.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-orange-100 transition hover:text-[#ff4b12]">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-[#071f50] text-[9px] text-white">{index + 1}</span>
                  {step.label}
                </a>
                {index < HUB_STEPS.length - 1 && <span className="text-[#ffb36d]">→</span>}
              </li>
            ))}
          </ol>

          <h1 className="mt-6 text-[3rem] font-black leading-[0.9] tracking-[-0.065em] sm:text-7xl xl:text-[5.6rem]">
            Find your
            <span className="block text-[#ff4b12]">university.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-[#526178] md:text-lg md:leading-8">
            {allUniversities.length} universities across {countryList.length} countries, each with real campus photos, fees, courses and how to apply from Pakistan.
          </p>

          <form onSubmit={submit} className="mt-7 flex max-w-xl items-center gap-2 rounded-full bg-white p-2 shadow-[0_20px_50px_rgba(7,31,80,0.1)] ring-1 ring-orange-100 focus-within:ring-2 focus-within:ring-[#ff4b12]">
            <Search size={20} className="ml-3 shrink-0 text-[#ff4b12]" />
            <label htmlFor="hero-uni-search" className="sr-only">
              Search universities
            </label>
            <input
              id="hero-uni-search"
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Try a subject, city or university"
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] font-bold outline-none placeholder:text-[#9aa5b5]"
            />
            <button type="submit" className="shrink-0 rounded-full bg-[#ff4b12] px-5 py-3 text-sm font-black text-white transition hover:bg-[#071f50]">
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#7a879c]">Popular:</span>
            {QUICK_SEARCHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSearch(item)}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-black ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:bg-[#071f50] hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>

          <a href="#subjects" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-[#071f50] transition hover:text-[#ff4b12]">
            <ArrowDown size={16} strokeWidth={3} /> Not sure what to search? Start with a subject
          </a>
        </div>

        {/* Phones: a swipeable row of the same photos */}
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 pt-3 sm:hidden [scrollbar-width:none]">
          {pins.map((university, index) => (
            <Link
              key={university.key}
              to={university.path}
              className="w-[46%] shrink-0 snap-start rounded-[6px] bg-white p-2 pb-2.5 shadow-[0_14px_30px_rgba(7,31,80,0.15)]"
              style={{ rotate: `${index % 2 ? 2 : -2}deg` }}
            >
              <CampusPhoto university={university} size="small" className="aspect-[4/3] rounded-[3px]" />
              <span className="mt-1.5 block truncate text-[12px] font-black text-[#071f50]">{university.name.replace(/\s*\(.*\)/, "")}</span>
              <span className="block truncate text-[10px] font-bold text-[#7a879c]">{university.city}</span>
            </Link>
          ))}
        </div>

        <div className="hidden sm:block">
          <div ref={boardRef} className="relative mx-auto aspect-[1.25] w-full max-w-[640px]">
            {pins.map((university, index) => (
              <Polaroid key={university.key} university={university} spot={PIN_SPOTS[index]} boardRef={boardRef} index={index} />
            ))}
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-[#7a879c]">
            <Hand size={14} /> Drag the photos around, or tap one to open its profile
          </p>
        </div>
      </div>
    </section>
  );
}

export default PinboardHero;
