import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Heart, MapPin } from "lucide-react";

import { TUITION_BANDS } from "../../../data/universities";
import { getCountryBySlug } from "../../../data/countries/countryRegistry";
import { FlagMark } from "../destinations/DestinationUI";
import CampusPhoto from "./CampusPhoto";

/** One university as a photo card, with a heart to save it to the shortlist. */
function UniCard({ university, saved, onToggle, tone = "light" }) {
  const country = getCountryBySlug(university.countrySlug);
  const band = TUITION_BANDS[university.tuitionBand] || TUITION_BANDS.Moderate;
  const dark = tone === "dark";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      className={`group flex flex-col overflow-hidden rounded-[22px] ring-2 transition hover:-translate-y-1 ${
        dark ? "bg-white/[0.06] text-white" : "bg-white text-[#071f50] shadow-[0_16px_40px_rgba(7,31,80,0.08)]"
      } ${saved ? "ring-[#ff4b12]" : "ring-transparent"}`}
    >
      <div className="relative">
        <Link to={university.path} tabIndex={-1} aria-hidden="true">
          <CampusPhoto university={university} size="small" className="aspect-[16/10]" imgClassName="transition duration-500 group-hover:scale-105" />
        </Link>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-[#071f50] shadow-sm">
          <FlagMark country={country} className="h-3 w-[18px] rounded-[2px] shadow-none" />
          {country?.name}
        </span>
        {onToggle && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.8 }}
            onClick={() => onToggle(university.key)}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${university.name} from your shortlist` : `Save ${university.name} to your shortlist`}
            className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full shadow-md transition ${
              saved ? "bg-[#ff4b12] text-white" : "bg-white/95 text-[#071f50] hover:text-[#ff4b12]"
            }`}
          >
            <Heart size={18} strokeWidth={2.5} fill={saved ? "currentColor" : "none"} />
          </motion.button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] font-black leading-[1.2] tracking-[-0.03em]">
          <Link to={university.path} className="hover:text-[#ff4b12]">
            {university.name}
          </Link>
        </h3>
        <p className={`mt-1 flex items-center gap-1 text-xs font-bold ${dark ? "text-white/55" : "text-[#7a879c]"}`}>
          <MapPin size={12} className="text-[#ff4b12]" /> {university.city}
          {university.founded && <span>· since {university.founded}</span>}
        </p>
        <p className={`mt-3 line-clamp-2 text-sm font-semibold leading-6 ${dark ? "text-white/70" : "text-[#5f6f89]"}`}>{university.popularFor}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${band.tone}`}>{band.label}</span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${dark ? "bg-white/10" : "bg-[#eef1f7]"}`}>{university.type}</span>
          {university.englishLevel === "most" && (
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${dark ? "bg-white/10" : "bg-[#eef1f7]"}`}>Mostly English</span>
          )}
        </div>

        <Link to={university.path} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-black text-[#ff4b12] transition-all hover:gap-2.5">
          Open profile <ArrowRight size={15} strokeWidth={3} />
        </Link>
      </div>
    </motion.article>
  );
}

export default UniCard;
