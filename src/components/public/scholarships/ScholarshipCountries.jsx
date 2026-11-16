import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import StepIntro from "../guide/StepIntro";
import { FlagMark, HonestyNote } from "../destinations/DestinationUI";
import { SCHOLARSHIPS_BY_COUNTRY, SCHOLARSHIP_STEPS } from "../../../data/countries/scholarshipFinder";

const WHATSAPP = `https://api.whatsapp.com/send?phone=923305718131&text=${encodeURIComponent("Hi Zaifan, I have a question about scholarships.")}`;

/** Step 4: one row per country, each opening that country's own scholarship step. */
function ScholarshipCountries({ onPick, lastReviewed }) {
  return (
    <section id="countries" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-24 pt-10 text-[#071f50] sm:px-5 md:pb-32 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={4}
          steps={SCHOLARSHIP_STEPS}
          title="Scholarships,"
          accent="country by country."
          text="The scholarship students ask us about most in each country. Each country guide explains its own rules, papers and dates."
          howTo="Tap “Show these” to filter the list above, or open the country guide for the full explanation."
        />

        <ul className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SCHOLARSHIPS_BY_COUNTRY.map(({ country, count, headline }) => (
            <li key={country.slug} className="flex flex-col rounded-[24px] bg-white p-5 ring-1 ring-orange-100">
              <div className="flex items-center gap-3">
                <FlagMark country={country} className="h-8 w-12 shrink-0 rounded-[5px]" />
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black tracking-[-0.03em]">{country.name}</h3>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#7a879c]">
                    {count} {count === 1 ? "scholarship" : "scholarships"} listed
                  </p>
                </div>
              </div>

              {headline && (
                <div className="mt-4 rounded-2xl bg-[#fff7ed] p-3.5 ring-1 ring-orange-100">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#ff4b12]">Most asked about</p>
                  <p className="mt-1 text-[15px] font-black leading-5">{headline.name}</p>
                  <p className="mt-1.5 text-sm font-semibold leading-6 text-[#5f6f89]">{headline.covers}</p>
                </div>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => onPick(country.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#071f50] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#ff4b12]"
                >
                  Show these {count}
                </button>
                <Link
                  to={`/countries/${country.slug}#scholarships`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1ea] px-4 py-2.5 text-xs font-black text-[#ff4b12] ring-1 ring-orange-100 transition hover:bg-[#ff4b12] hover:text-white"
                >
                  {country.name} guide <ArrowRight size={13} strokeWidth={3} />
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-[24px] border-2 border-dashed border-[#071f50]/15 p-5 sm:flex-row sm:items-center md:p-6">
          <p className="text-sm font-bold leading-6">
            Can't find a scholarship you heard about? Universities add and change awards every year. Ask a real person, free.
          </p>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 text-sm font-black text-[#062b16] transition hover:bg-[#3ee07a]"
          >
            <FaWhatsapp size={17} /> Ask on WhatsApp
          </a>
        </div>

        <HonestyNote lastReviewed={lastReviewed} sources={[]} />
      </div>
    </section>
  );
}

export default ScholarshipCountries;
