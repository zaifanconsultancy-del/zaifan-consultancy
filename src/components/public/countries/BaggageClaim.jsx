import { Luggage } from "lucide-react";

import { countryList } from "../../../data/countries";
import { FlagMark } from "../destinations/DestinationUI";
import { gatewayOf } from "./countriesData";

// Two bags per country, alternating so the same flag never rides twice in a row.
const BAGS = [
  ...countryList.map((country) => ({ country, fact: `Work after study: ${country.quickFacts.postStudy}` })),
  ...countryList.map((country) => ({ country, fact: `Tuition ${country.quickFacts.tuition}` })),
].map((bag, index) => ({ ...bag, size: index % 3 }));

const SIZES = ["w-[190px] h-[118px]", "w-[214px] h-[128px]", "w-[176px] h-[110px]"];

/** A light, rich colour from the flag for the suitcase shell. */
function shellColour(country) {
  const usable = country.flagColors.filter((colour) => !["#ffffff", "#111111"].includes(colour.toLowerCase()));
  return usable[0] || "#071f50";
}

function Suitcase({ country, fact, size, index }) {
  const gateway = gatewayOf(country);
  const colour = shellColour(country);

  return (
    <div className="zaifan-bag-bob relative shrink-0 self-end" style={{ animationDelay: `${(index % 5) * -0.37}s` }}>
      {/* Handle */}
      <span className="absolute -top-3.5 left-1/2 h-5 w-14 -translate-x-1/2 rounded-t-xl border-[5px] border-b-0 border-[#1f2937]" />
      <div
        className={`relative overflow-hidden rounded-[20px] p-2.5 shadow-[0_10px_0_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-3 hover:rotate-[-2deg] ${SIZES[size]}`}
        style={{
          backgroundColor: colour,
          backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 3px, transparent 3px 34px)",
        }}
      >
        {/* Stickers */}
        <FlagMark country={country} className="absolute right-2 top-2 h-6 w-9 rotate-12 rounded-[4px] ring-2 ring-white" />
        <span className="absolute bottom-2 right-3 rotate-[-8deg] rounded-full bg-white px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-[#ff4b12]">
          Zaifan
        </span>

        {/* Luggage label */}
        <div className="relative w-[78%] rounded-xl bg-[#fff7ed] p-2 text-[#071f50] shadow-sm">
          <p className="font-mono text-[10px] font-black tracking-[0.08em]">
            PAK <span className="text-[#ff4b12]">→</span> {gateway.airport}
          </p>
          <p className="text-xs font-black leading-4">{country.name}</p>
          <p className="mt-0.5 line-clamp-2 text-[10px] font-bold leading-[13px] text-[#5f6f89]">{fact}</p>
        </div>
      </div>
      {/* Wheels */}
      <span className="absolute -bottom-1.5 left-5 h-3 w-3 rounded-full bg-[#1f2937]" />
      <span className="absolute -bottom-1.5 right-5 h-3 w-3 rounded-full bg-[#1f2937]" />
    </div>
  );
}

/**
 * Airport baggage claim: suitcases in flag colours ride a conveyor belt, each
 * tagged with a real fact. The belt stops while you hover so you can read.
 */
function BaggageClaim() {
  const loop = [...BAGS, ...BAGS];

  return (
    <section aria-label="Quick facts from every destination" className="relative overflow-hidden bg-[#fff7ed] pb-6 pt-4">
      <div className="mx-auto flex max-w-[1350px] flex-wrap items-center justify-between gap-3 px-4 sm:px-5">
        {/* Airport wayfinding sign */}
        <div className="inline-flex items-stretch overflow-hidden rounded-lg shadow-[0_8px_20px_rgba(7,31,80,0.15)]">
          <span className="grid place-items-center bg-[#111827] px-3 text-[#ffcc00]">
            <Luggage size={22} />
          </span>
          <span className="bg-[#ffcc00] px-4 py-2 text-[#111827]">
            <span className="block text-sm font-black uppercase leading-4 tracking-[0.06em]">Baggage claim · Belt 9</span>
            <span className="block text-[11px] font-bold">Facts arriving from 9 countries</span>
          </span>
        </div>
        <p className="hidden font-mono text-[11px] font-bold text-[#7a879c] sm:block">hover a bag to stop the belt</p>
      </div>

      <div className="zaifan-marquee-track relative mt-8">
        <div className="zaifan-marquee items-end" style={{ "--marquee-duration": `${BAGS.length * 7}s` }}>
          {loop.map((bag, index) => (
            <div key={`${bag.country.slug}-${index}`} className="flex shrink-0 flex-col justify-end">
              <div className="px-3 pb-1.5">
                <Suitcase {...bag} index={index} />
              </div>
              {/* Each bag carries its own slice of belt, so slats and bags move as one */}
              <span
                aria-hidden="true"
                className="block h-7 border-y-4 border-[#9ca3af] bg-[#1f2937]"
                style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 2px, transparent 2px 38px)" }}
              />
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="mx-auto h-3 w-[96%] rounded-b-2xl bg-[#6b7280]" />
      </div>
    </section>
  );
}

export default BaggageClaim;
