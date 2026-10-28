import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Heart, X } from "lucide-react";

import { TUITION_BANDS, formatStudents } from "../../../data/universities";
import { getCountryBySlug } from "../../../data/countries/countryRegistry";
import { FlagMark } from "../destinations/DestinationUI";
import CampusPhoto from "./CampusPhoto";
import HubStepLabel from "./HubStepLabel";
import { MAX_COMPARE } from "./useShortlist";

const ROWS = [
  { label: "Where", value: (university) => `${university.city}, ${getCountryBySlug(university.countrySlug)?.name}` },
  { label: "Type", value: (university) => university.type },
  { label: "Fees", value: (university) => `${TUITION_BANDS[university.tuitionBand]?.label}: ${university.tuitionNote}` },
  { label: "Taught in English", value: (university) => university.english || "Ask us" },
  { label: "Starts", value: (university) => university.intake || "Ask us" },
  { label: "Apply through", value: (university) => university.applyVia },
  { label: "Founded", value: (university) => university.founded || "–" },
  { label: "Students", value: (university) => formatStudents(university.students) || "–" },
  { label: "Best known for", value: (university) => university.popularFor },
];

/** Step 3: the saved universities side by side. */
function UniCompare({ shortlist }) {
  const { picks, remove, clear } = shortlist;
  const compared = picks.slice(0, MAX_COMPARE);

  return (
    <section id="compare" className="scroll-mt-20 bg-[#ff4b12] px-4 py-20 text-white sm:px-5 md:py-28">
      <div className="mx-auto max-w-[1350px]">
        <HubStepLabel step={3} />
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
            Compare your
            <span className="block text-[#071f50]">shortlist.</span>
          </h2>
          <p className="max-w-md text-sm font-semibold leading-6 text-white/85 md:text-base md:leading-7">
            The first {MAX_COMPARE} universities you saved appear side by side. Remove one to make room for the next. Your list stays saved on this device.
          </p>
        </div>

        {picks.length === 0 ? (
          <div className="mt-10 grid place-items-center rounded-[26px] border-2 border-dashed border-white/50 px-6 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#ff4b12]">
              <Heart size={28} strokeWidth={2.5} />
            </span>
            <p className="mt-5 text-2xl font-black tracking-[-0.03em]">Nothing saved yet.</p>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/85">
              Tap the heart on any university in Step 2 and it lands here. Save two or three to see them side by side.
            </p>
            <a href="#finder" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#071f50] px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-[#071f50]">
              Go to the finder <ArrowRight size={15} strokeWidth={3} />
            </a>
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-white/80">Saved ({picks.length}):</span>
              {picks.map((university, index) => (
                <span
                  key={university.key}
                  className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-1 text-xs font-black ${
                    index < MAX_COMPARE ? "bg-white text-[#071f50]" : "bg-white/20 text-white"
                  }`}
                >
                  <FlagMark country={getCountryBySlug(university.countrySlug)} className="h-3 w-[18px] rounded-[2px] shadow-none" />
                  {university.name.replace(/\s*\(.*\)/, "")}
                  <button type="button" onClick={() => remove(university.key)} aria-label={`Remove ${university.name}`} className="grid h-5 w-5 place-items-center rounded-full hover:bg-[#ff4b12] hover:text-white">
                    <X size={12} strokeWidth={3} />
                  </button>
                </span>
              ))}
              <button type="button" onClick={clear} className="text-xs font-black text-white/85 underline underline-offset-4 hover:text-white">
                Clear all
              </button>
            </div>

            <div className="mt-6 overflow-x-auto rounded-[26px] bg-white text-[#071f50] shadow-[0_30px_70px_rgba(7,31,80,0.25)]">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 w-40 bg-white p-4 align-bottom text-[11px] font-black uppercase tracking-[0.14em] text-[#7a879c]">University</th>
                    <AnimatePresence initial={false}>
                      {compared.map((university) => (
                        <motion.th key={university.key} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-[30%] p-4 align-top font-normal">
                          <CampusPhoto university={university} size="small" className="h-36 rounded-2xl md:h-44" />
                          <Link to={university.path} className="mt-3 block text-lg font-black leading-6 tracking-[-0.03em] hover:text-[#ff4b12]">
                            {university.name}
                          </Link>
                        </motion.th>
                      ))}
                    </AnimatePresence>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.label} className="border-t border-[#eef1f5]">
                      <th scope="row" className="sticky left-0 z-10 bg-white p-4 align-top text-xs font-black text-[#7a879c]">
                        {row.label}
                      </th>
                      {compared.map((university) => (
                        <td key={university.key} className="p-4 align-top text-sm font-bold leading-6">
                          {row.value(university)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t border-[#eef1f5]">
                    <th className="sticky left-0 z-10 bg-white p-4" />
                    {compared.map((university) => (
                      <td key={university.key} className="p-4">
                        <Link to={university.path} className="inline-flex items-center gap-1.5 rounded-full bg-[#071f50] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#ff4b12]">
                          Full profile <ArrowRight size={14} strokeWidth={3} />
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default UniCompare;
