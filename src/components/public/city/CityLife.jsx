import { Link } from "react-router-dom";
import { ArrowRight, Award, MapPin } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { iconFor } from "../destinations/destinationUtils";
import { CITY_STEPS } from "../../../data/countries/cityGuides";

/** Step 4: what living here is like, the country-wide basics, and scholarships. */
function CityLife({ city, country }) {
  const basics = country.studentLife || [];

  return (
    <section id="life" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-20 pt-10 text-[#071f50] sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={4}
          steps={CITY_STEPS}
          title="What daily life"
          accent="is really like."
          text={`Rooms, food, getting around and work: the things you will deal with every week in ${city.name}.`}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <div>
            <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">
              <MapPin size={14} /> Only in {city.name}
            </p>
            <ul className="mt-4 grid gap-3">
              {city.studentLife.map((note, index) => (
                <li key={note.title || note.text} className="flex items-start gap-4 rounded-[22px] bg-white p-5 ring-1 ring-orange-100">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#071f50] font-mono text-xs font-black text-white">{index + 1}</span>
                  <div className="min-w-0">
                    {note.title && <h3 className="text-base font-black tracking-[-0.02em]">{note.title}</h3>}
                    <p className={note.title ? "mt-1 text-sm font-semibold leading-6 text-[#5f6f89]" : "text-base font-black leading-6 tracking-[-0.02em]"}>{note.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            {city.scholarshipNote && (
              <div className="mt-5 rounded-[22px] bg-[#071f50] p-5 text-white">
                <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">
                  <Award size={14} /> Scholarships in {city.name}
                  {city.scholarshipBody ? ` · ${city.scholarshipBody}` : ""}
                </p>
                <p className="mt-2.5 text-sm font-semibold leading-6 text-white/85">{city.scholarshipNote}</p>
                <Link
                  to={`/countries/${country.slug}#scholarships`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-[#ffb36d] transition-all hover:gap-2.5"
                >
                  All {country.name} scholarships <ArrowRight size={15} strokeWidth={3} />
                </Link>
              </div>
            )}
          </div>

          {basics.length > 0 && (
            <div>
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">The same everywhere in {country.name}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {basics.map((item) => {
                  const Icon = iconFor(item.icon);
                  return (
                    <div key={item.title} className="rounded-[22px] bg-white p-5 ring-1 ring-orange-100">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                        <Icon size={19} />
                      </span>
                      <h3 className="mt-3 text-base font-black tracking-[-0.02em]">{item.title}</h3>
                      <p className="mt-1.5 text-sm font-semibold leading-6 text-[#5f6f89]">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CityLife;
