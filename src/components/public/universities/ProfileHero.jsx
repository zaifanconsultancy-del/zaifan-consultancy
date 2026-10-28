import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, ExternalLink, Heart, MapPin } from "lucide-react";

import { TUITION_BANDS } from "../../../data/universities";
import { FlagMark } from "../destinations/DestinationUI";
import CampusPhoto from "./CampusPhoto";

function PassRow({ label, value }) {
  return (
    <div className="border-t border-dashed border-[#d9dfe8] py-2 first:border-t-0">
      <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-black leading-5 text-[#071f50]">{value}</dd>
    </div>
  );
}

/** Top of a university profile: name and actions beside a big campus photo. */
function ProfileHero({ university, country, saved, onToggleSave, bookPath }) {
  const band = TUITION_BANDS[university.tuitionBand] || TUITION_BANDS.Moderate;
  const longName = university.name.length > 38;

  return (
    <section className="relative overflow-hidden bg-[#fff7ed] px-4 pb-16 pt-28 text-[#071f50] sm:px-5 md:pb-24 md:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(7,31,80,0.07)_1.2px,transparent_1.2px)] [background-size:22px_22px]" />

      <div className="relative mx-auto grid max-w-[1350px] items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs font-black text-[#7a879c]">
            <Link to="/universities" className="hover:text-[#ff4b12]">
              Universities
            </Link>
            <ChevronRight size={13} />
            <Link to={`/countries/${country.slug}`} className="hover:text-[#ff4b12]">
              {country.name}
            </Link>
            <ChevronRight size={13} />
            <span className="text-[#071f50]">{university.city}</span>
          </nav>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-black shadow-sm ring-1 ring-orange-100">
            <FlagMark country={country} className="h-3.5 w-[21px] rounded-[2px] shadow-none" />
            <MapPin size={13} className="text-[#ff4b12]" />
            {university.city}, {country.name}
          </p>

          <h1
            className={`mt-4 font-black leading-[0.95] tracking-[-0.055em] ${
              longName ? "text-4xl sm:text-5xl xl:text-6xl" : "text-5xl sm:text-6xl xl:text-7xl"
            }`}
          >
            {university.name}
          </h1>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-[#526178] md:text-lg md:leading-8">
            Best known for <span className="font-black text-[#071f50]">{university.popularFor.charAt(0).toLowerCase() + university.popularFor.slice(1)}</span>.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-black ${band.tone}`}>{band.label}</span>
            <span className="rounded-full bg-[#071f50] px-3 py-1.5 text-xs font-black text-white">{university.type} university</span>
            {university.englishLevel === "most" && <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black ring-1 ring-orange-100">Mostly taught in English</span>}
            {university.founded && <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black ring-1 ring-orange-100">Since {university.founded}</span>}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={bookPath} className="inline-flex items-center gap-2 rounded-full bg-[#ff4b12] px-6 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(255,75,18,0.3)] transition hover:bg-[#071f50]">
              Ask us about this university <ArrowRight size={16} strokeWidth={3} />
            </Link>
            {university.website && (
              <a
                href={university.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-black ring-1 ring-orange-100 transition hover:text-[#ff4b12]"
              >
                Official website <ExternalLink size={15} strokeWidth={2.6} />
              </a>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={onToggleSave}
              aria-pressed={saved}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-black transition ${
                saved ? "bg-[#071f50] text-white" : "bg-white ring-1 ring-orange-100 hover:text-[#ff4b12]"
              }`}
            >
              <Heart size={16} strokeWidth={2.6} fill={saved ? "#ff4b12" : "none"} className={saved ? "text-[#ff4b12]" : ""} />
              {saved ? "Saved to your shortlist" : "Save to shortlist"}
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative pb-24 sm:pb-16">
          <CampusPhoto university={university} eager credit className="aspect-[4/3] rounded-[30px] shadow-[0_30px_70px_rgba(7,31,80,0.22)]" />

          {/* Student-pass style card with the key facts */}
          <motion.dl
            initial={{ opacity: 0, y: 30, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: -3 }}
            transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.4 }}
            className="absolute -bottom-2 left-3 w-[230px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_50px_rgba(7,31,80,0.25)] sm:left-[-18px] sm:w-[250px]"
          >
            <div className="flex items-center justify-between bg-[#071f50] px-4 py-2.5 text-white">
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em]">Quick facts</span>
              <FlagMark country={country} className="h-3.5 w-[21px] rounded-[2px] shadow-none" />
            </div>
            <div className="px-4 py-2">
              <PassRow label="Starts" value={(university.intake || "Ask us").replace(/·/g, "/")} />
              <PassRow label="Apply through" value={university.applyVia} />
              <PassRow label="Fees" value={band.label} />
            </div>
            {/* Barcode strip */}
            <div className="mx-4 mb-3 h-7 bg-[repeating-linear-gradient(90deg,#071f50_0_2px,transparent_2px_4px,#071f50_4px_5px,transparent_5px_9px,#071f50_9px_12px,transparent_12px_14px)]" aria-hidden="true" />
          </motion.dl>

          {university.fact && (
            <motion.aside
              initial={{ opacity: 0, y: -20, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: 4 }}
              transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.6 }}
              className="absolute -top-6 right-2 w-[200px] bg-[#ffe3c4] p-4 shadow-[0_18px_40px_rgba(7,31,80,0.18)] sm:right-[-14px] sm:w-[230px]"
            >
              <span className="absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 bg-white/60" aria-hidden="true" />
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Did you know?</p>
              <p className="mt-1.5 text-[13px] font-bold leading-5 text-[#071f50]">{university.fact}</p>
            </motion.aside>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default ProfileHero;
