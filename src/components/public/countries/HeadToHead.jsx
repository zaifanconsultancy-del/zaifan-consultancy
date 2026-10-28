import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Crown, X } from "lucide-react";

import { formatUsd } from "../../../data/countries/costs";
import { FlagMark } from "../destinations/DestinationUI";
import { SNAPSHOTS, traitsOf } from "./countriesData";

const NUMBER_ROWS = [
  { label: "First year", key: "firstYear" },
  { label: "Tuition", key: "tuitionPerYear", suffix: "/yr" },
  { label: "Living", key: "livingPerMonth", suffix: "/mo" },
];

const TEXT_ROWS = [
  { label: "Tuition (local)", get: (country) => country.quickFacts.tuition },
  { label: "Living (local)", get: (country) => country.quickFacts.living },
  { label: "Intakes", get: (country) => country.quickFacts.intakes },
  { label: "Language", get: (country) => country.quickFacts.language },
  { label: "Work while studying", get: (country) => country.quickFacts.work },
  { label: "After graduation", get: (country) => country.quickFacts.postStudy },
  { label: "Visa", get: (country) => country.quickFacts.visa },
  { label: "Good for", get: (country) => traitsOf(country).map((trait) => trait.label).join(" · ") },
];

/** Full-screen sheet putting the shortlist side by side, cheapest highlighted. */
function HeadToHead({ countries, onRemove, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const columns = `minmax(96px,0.7fr) repeat(${countries.length}, minmax(168px,1fr))`;
  // Row labels stay pinned on the left while the columns scroll sideways on phones.
  const labelClass = "sticky left-0 z-[1] bg-white pr-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#7a879c] sm:text-[11px]";
  const lowest = (key) => Math.min(...countries.map((country) => SNAPSHOTS[country.slug][key] ?? Infinity));
  const highest = (key) => Math.max(...countries.map((country) => SNAPSHOTS[country.slug][key] ?? 0));
  const wins = Object.fromEntries(
    countries.map((country) => [country.slug, NUMBER_ROWS.filter((row) => SNAPSHOTS[country.slug][row.key] === lowest(row.key)).length]),
  );
  const topWins = Math.max(...Object.values(wins));
  const advisorPath = `/appointment?country=${encodeURIComponent(countries[0]?.name || "")}&service=${encodeURIComponent("Country Comparison")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10003] flex items-end justify-center bg-[#071f50]/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Compare your shortlist"
    >
      <motion.div
        initial={{ y: 80, opacity: 0, rotate: 1 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[32px] bg-white text-[#071f50] shadow-[0_40px_100px_rgba(0,0,0,0.35)] sm:rounded-[32px]"
      >
        <div className="flex items-center justify-between gap-4 bg-[#071f50] px-6 py-5 text-white">
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[#ff7b1c]">Head to head · {countries.length} contenders</p>
            <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">Who wins on cost?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-[#ff4b12]"
          >
            <X size={20} strokeWidth={2.6} />
          </button>
        </div>

        <div className="overflow-auto px-4 pb-4 sm:px-6">
          <div className="min-w-fit">
            <div className="sticky top-0 z-10 grid gap-3 bg-white py-4" style={{ gridTemplateColumns: columns }}>
              <span className="sticky left-0 z-[1] bg-white" />
              {countries.map((country) => {
                const champion = countries.length > 1 && wins[country.slug] === topWins && topWins > 0;
                return (
                  <div
                    key={country.slug}
                    className={`relative flex items-center justify-between gap-2 rounded-2xl p-3 ring-2 ${champion ? "bg-[#fff1ea] ring-[#ff4b12]" : "bg-[#fff7ed] ring-orange-100"}`}
                  >
                    {champion && (
                      <span className="absolute -top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#ff4b12] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                        <Crown size={10} fill="currentColor" /> Best value
                      </span>
                    )}
                    <Link to={`/countries/${country.slug}`} className="flex items-center gap-2 hover:text-[#ff4b12]">
                      <FlagMark country={country} className="h-6 w-9" />
                      <span className="font-black">{country.name}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => onRemove(country.slug)}
                      aria-label={`Remove ${country.name}`}
                      className="grid h-7 w-7 place-items-center rounded-full text-[#7a879c] transition hover:bg-white hover:text-[#ff4b12]"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                );
              })}
            </div>

            {NUMBER_ROWS.map((row) => (
              <div key={row.key} className="grid items-center gap-3 border-t border-orange-100 py-3" style={{ gridTemplateColumns: columns }}>
                <p className={labelClass}>{row.label}</p>
                {countries.map((country) => {
                  const value = SNAPSHOTS[country.slug][row.key];
                  const isBest = countries.length > 1 && value !== null && value === lowest(row.key);
                  return (
                    <div key={country.slug} className="px-3">
                      <p className={`text-base font-black sm:text-lg ${isBest ? "text-emerald-600" : ""}`}>
                        {formatUsd(value)}
                        {row.suffix && <span className="text-xs font-bold opacity-60"> {row.suffix}</span>}
                        {isBest && <span className="ml-1.5 text-[10px] font-black uppercase tracking-[0.1em]">W</span>}
                      </p>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#fff1ea]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${value === null ? 0 : (value / highest(row.key)) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-full rounded-full ${isBest ? "bg-emerald-500" : "bg-[#ff4b12]"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {TEXT_ROWS.map((row) => (
              <div key={row.label} className="grid items-start gap-3 border-t border-orange-100 py-3" style={{ gridTemplateColumns: columns }}>
                <p className={`${labelClass} pt-0.5`}>{row.label}</p>
                {countries.map((country) => (
                  <p key={country.slug} className="px-3 text-sm font-bold leading-6 text-[#405672]">
                    {row.get(country)}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-orange-100 bg-[#fff7ed] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold leading-5 text-[#7a879c]">
            &ldquo;Best value&rdquo; = lowest on the most cost rows. US$ figures are approximate, using the cheapest public option and city.
            Some visas ask you to show more money (for example Germany&apos;s blocked account).
          </p>
          <Link
            to={advisorPath}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-6 py-3 text-sm font-black text-white transition hover:bg-[#ff642f]"
          >
            Help me decide <ArrowRight size={16} strokeWidth={3} />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default HeadToHead;
