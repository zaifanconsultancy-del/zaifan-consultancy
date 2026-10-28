import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Briefcase, Cog, Cpu, FlaskConical, Palette, Scale, Stethoscope } from "lucide-react";

import { SUBJECTS, allUniversities } from "../../../data/universities";
import { getCountryBySlug } from "../../../data/countries/countryRegistry";
import { FlagMark } from "../destinations/DestinationUI";
import CampusPhoto from "./CampusPhoto";
import HubStepLabel from "./HubStepLabel";

const ICONS = {
  engineering: Cog,
  computing: Cpu,
  medicine: Stethoscope,
  business: Briefcase,
  design: Palette,
  science: FlaskConical,
  law: Scale,
  humanities: BookOpen,
};

const LOCKERS = SUBJECTS.map((subject) => {
  const matches = allUniversities.filter((university) => university.subjects.includes(subject.id));
  return { ...subject, count: matches.length, picks: matches.filter((university) => university.photo).slice(0, 3) };
});

function Locker({ locker, number, open, onToggle, onShowAll }) {
  const Icon = ICONS[locker.id] || BookOpen;

  return (
    <div className="relative h-[330px] [perspective:1400px]">
      {/* Inside the locker */}
      <div className="absolute inset-0 flex flex-col rounded-[14px] bg-[#04122f] p-4 ring-1 ring-white/10">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">Inside: {locker.count} universities</p>
        <ul className="mt-3 space-y-2">
          {locker.picks.map((university) => (
            <li key={university.key}>
              <Link
                to={university.path}
                tabIndex={open ? 0 : -1}
                className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] p-1.5 pr-3 transition hover:bg-white/[0.12]"
              >
                <CampusPhoto university={university} size="small" className="h-11 w-14 shrink-0 rounded-lg" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-black text-white">{university.name.replace(/\s*\(.*\)/, "")}</span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/55">
                    <FlagMark country={getCountryBySlug(university.countrySlug)} className="h-2.5 w-[15px] rounded-[2px] shadow-none" />
                    {university.city}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          onClick={() => onShowAll(locker.id)}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-4 py-2.5 text-xs font-black text-white transition hover:bg-white hover:text-[#071f50]"
        >
          Show all {locker.count} in the finder <ArrowRight size={14} strokeWidth={3} />
        </button>
      </div>

      {/* The door swings open on its left hinge */}
      <motion.button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`${open ? "Close" : "Open"} the ${locker.label} locker`}
        animate={{ rotateY: open ? -112 : 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 17 }}
        style={{ transformOrigin: "left center", transformStyle: "preserve-3d", pointerEvents: open ? "none" : "auto" }}
        className="group absolute inset-0 flex flex-col rounded-[14px] bg-[#fff7ed] p-5 text-left text-[#071f50] shadow-[0_20px_40px_rgba(0,0,0,0.3)] [backface-visibility:hidden]"
      >
        <span className="flex items-start justify-between">
          <span className="rounded-md bg-[#071f50] px-2 py-1 font-mono text-xs font-black text-white">{String(number).padStart(2, "0")}</span>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#ff4b12] text-white transition group-hover:rotate-12">
            <Icon size={20} strokeWidth={2.4} />
          </span>
        </span>
        {/* Vents */}
        <span className="mt-5 space-y-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((vent) => (
            <span key={vent} className="block h-1.5 w-2/3 rounded-full bg-[#071f50]/10" />
          ))}
        </span>
        <span className="mt-auto block text-2xl font-black leading-7 tracking-[-0.04em]">{locker.label}</span>
        <span className="mt-1 block text-xs font-bold text-[#7a879c]">{locker.count} universities</span>
        {/* Handle */}
        <span className="absolute right-4 top-1/2 h-14 w-2.5 -translate-y-1/2 rounded-full bg-[#071f50]/80 transition group-hover:bg-[#ff4b12]" aria-hidden="true" />
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#ff4b12]">
          Tap to open <ArrowRight size={13} strokeWidth={3} />
        </span>
      </motion.button>
    </div>
  );
}

/** Step 1: eight subject lockers. Open one to peek inside, then jump to the finder. */
function SubjectLockers({ onPickSubject }) {
  const [openId, setOpenId] = useState(null);

  return (
    <section id="subjects" className="scroll-mt-20 bg-[#071f50] px-4 py-20 text-white sm:px-5 md:py-28">
      <div className="mx-auto max-w-[1350px]">
        <HubStepLabel step={1} tone="dark" />
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
            What do you want
            <span className="block text-[#ffb36d]">to study?</span>
          </h2>
          <p className="max-w-md text-sm font-semibold leading-6 text-white/65 md:text-base md:leading-7">
            Each locker is a subject. Open one to see a few universities inside, then press the orange button to see every match in the finder.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOCKERS.map((locker, index) => (
            <Locker
              key={locker.id}
              locker={locker}
              number={index + 1}
              open={openId === locker.id}
              onToggle={() => setOpenId((current) => (current === locker.id ? null : locker.id))}
              onShowAll={onPickSubject}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default SubjectLockers;
