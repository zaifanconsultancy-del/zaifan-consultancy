import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, ArrowUpRight, Scissors } from "lucide-react";

import StepIntro from "./StepIntro";

/** One scholarship as a cut-out coupon: the level on the stub, the details on the body. */
function Coupon({ scholarship, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: (index % 2) * 0.08 }}
      className="relative flex overflow-hidden rounded-[22px] bg-white shadow-[0_18px_45px_rgba(7,31,80,0.08)] ring-1 ring-orange-100"
    >
      <div className="flex w-12 shrink-0 items-center justify-center bg-[#071f50] sm:w-14">
        <span className="rotate-180 whitespace-nowrap font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[#ffb36d] [writing-mode:vertical-rl]">
          Coupon 0{index + 1}
        </span>
      </div>

      {/* Perforation between stub and body, with notches cut from the page colour */}
      <div aria-hidden="true" className="relative w-0 border-l-2 border-dashed border-[#071f50]/15">
        <span className="absolute -left-[11px] -top-[11px] h-5 w-5 rounded-full bg-[#fff7ed]" />
        <span className="absolute -bottom-[11px] -left-[11px] h-5 w-5 rounded-full bg-[#fff7ed]" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <span className="w-fit rounded-full bg-[#071f50] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">For {scholarship.level}</span>
        <p className="mt-3 text-xs font-bold text-[#7a879c]">{scholarship.provider}</p>
        <h3 className="mt-1 text-xl font-black leading-tight tracking-[-0.03em]">{scholarship.name}</h3>
        <p className="mt-3 text-[15px] font-black leading-6 text-[#ff4b12]">{scholarship.covers}</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#5f6f89]">{scholarship.note}</p>
        {scholarship.link && (
          <a
            href={scholarship.link}
            target="_blank"
            rel="noreferrer"
            className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-black text-[#071f50] hover:text-[#ff4b12]"
          >
            Official page <ArrowUpRight size={15} strokeWidth={3} />
          </a>
        )}
      </div>
    </motion.article>
  );
}

/** Italy-style regional funding: how it works, which office, and the common mistakes. */
function FundingExplainer({ funding, country }) {
  return (
    <div className="mt-16">
      <h3 className="text-3xl font-black tracking-[-0.045em] md:text-4xl">{funding.title}</h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {funding.explainer.map((item, index) => (
          <div key={item.title} className="rounded-[22px] bg-white p-5 ring-1 ring-orange-100">
            <span className="font-mono text-xs font-black text-[#ff4b12]">0{index + 1}</span>
            <h4 className="mt-2 text-lg font-black tracking-[-0.02em]">{item.title}</h4>
            <p className="mt-1.5 text-sm font-semibold leading-6 text-[#5f6f89]">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-orange-100">
          <p className="bg-[#071f50] px-5 py-3 text-sm font-black text-white">Which office do you apply to? It depends on your university's city.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#7a879c]">
                  <th className="px-5 py-3 font-black">Region</th>
                  <th className="px-5 py-3 font-black">Scholarship office</th>
                  <th className="px-5 py-3 font-black">Cities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {funding.bodies.map((row) => (
                  <tr key={row.region}>
                    <td className="px-5 py-3 font-black">{row.region}</td>
                    <td className="px-5 py-3 font-bold text-[#ff4b12]">{row.body}</td>
                    <td className="px-5 py-3 font-semibold text-[#5f6f89]">
                      {row.citySlug ? (
                        <Link to={`/countries/${country.slug}/${row.citySlug}`} className="hover:text-[#ff4b12] hover:underline">
                          {row.cities}
                        </Link>
                      ) : (
                        row.cities
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[24px] bg-[#071f50] p-5 text-white md:p-6">
          <p className="flex items-center gap-2 text-sm font-black text-[#ffb36d]">
            <AlertTriangle size={16} /> Mistakes that cost students the scholarship
          </p>
          <ul className="mt-3 grid gap-2.5">
            {funding.mistakes.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm font-semibold leading-6 text-white/85">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff7b1c]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Step 4: real scholarships as coupons, plus how regional funding works where it applies. */
function ScholarshipCoupons({ country }) {
  return (
    <section id="scholarships" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-20 pt-10 text-[#071f50] sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={4}
          title="Who could pay"
          accent="for some of it?"
          howTo="Each coupon is a real scholarship. Check the level on the left, see what it covers, then open the official page."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {country.scholarships.map((scholarship, index) => (
            <Coupon key={scholarship.name} scholarship={scholarship} index={index} />
          ))}
        </div>

        {country.funding && <FundingExplainer funding={country.funding} country={country} />}

        <div className="mt-10 flex flex-col gap-4 rounded-[24px] border-2 border-dashed border-[#071f50]/15 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <p className="flex items-start gap-3 text-sm font-bold leading-6">
            <Scissors size={18} className="mt-0.5 shrink-0 text-[#ff4b12]" />
            No scholarship is guaranteed. Plan a budget that works without one, and treat any award as a bonus.
          </p>
          <Link
            to="/scholarships"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#071f50] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff4b12]"
          >
            Compare scholarships in all 9 countries <ArrowRight size={16} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ScholarshipCoupons;
