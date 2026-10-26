import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";

import { euHub, getEuCountries } from "../../data/countries";
import {
  ConsultationBand,
  DripDivider,
  FlagMark,
  SectionHeader,
} from "../../components/public/destinations/DestinationUI";
import { fadeUp, iconFor } from "../../components/public/destinations/destinationUtils";

const EU_FLAG = { slug: "european-union", code: "EU", name: "European Union" };

function EuHubPage() {
  const countries = getEuCountries();
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    document.title = "Study in the European Union | Zaifan Consultancy";
  }, []);

  return (
    <main className="cv-sections overflow-hidden bg-[#fff7ed] text-[#071f50]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 pb-14 pt-28 sm:px-5 md:pb-20 md:pt-36">
        <div className="pointer-events-none absolute left-[-8%] top-[8%] -z-10 h-[460px] w-[460px] rounded-full bg-[#003399]/12 blur-[100px]" />
        <div className="pointer-events-none absolute right-[-5%] top-[4%] -z-10 h-[520px] w-[520px] rounded-full bg-[#ff4b12]/14 blur-[110px]" />

        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mx-auto max-w-[1350px] text-center">
          <div className="flex justify-center">
            <FlagMark country={EU_FLAG} className="h-14 w-[84px]" />
          </div>
          <h1 className="mx-auto mt-6 max-w-5xl text-[2.6rem] font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl md:text-7xl xl:text-[88px]">
            {euHub.headline.replace("European Union", "")}
            <span className="text-[#ff4b12]">European Union</span>.
          </h1>
          <p className="mx-auto mt-5 inline-flex rounded-full bg-[#071f50] px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white sm:text-xs">
            {euHub.tagline}
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-[15px] font-semibold leading-7 text-[#526178] sm:text-lg sm:leading-9">{euHub.intro}</p>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="px-4 pb-12 sm:px-5 md:pb-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.08 }}
          className="mx-auto grid max-w-[1350px] gap-5 md:grid-cols-2 xl:grid-cols-4"
        >
          {euHub.benefits.map((benefit, index) => {
            const Icon = iconFor(benefit.icon);
            const dark = index === 0;
            return (
              <motion.div
                key={benefit.title}
                variants={fadeUp}
                className={`rounded-[30px] p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ${
                  dark ? "bg-[#003399] text-white ring-[#003399]" : "bg-white ring-orange-100"
                }`}
              >
                <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl ${dark ? "bg-white/12 text-[#ffcc00]" : "bg-[#fff1ea] text-[#ff4b12]"}`}>
                  <Icon size={27} strokeWidth={2.6} />
                </div>
                <h3 className="text-xl font-black tracking-[-0.035em]">{benefit.title}</h3>
                <p className={`mt-3 text-sm font-semibold leading-7 ${dark ? "text-white/78" : "text-[#61708a]"}`}>{benefit.text}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Compare EU destinations */}
      <DripDivider color="#fff7ed" background="#071f50" />
      <section className="bg-[#071f50] px-4 py-12 text-white sm:px-5 md:py-20">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            tone="dark"
            eyebrow="EU destinations we cover"
            title="Compare before you choose."
            text="Same EU benefits, very different costs and rules. Open any country for its full guide."
          />

          <div className="mt-12 overflow-x-auto rounded-[28px] ring-1 ring-white/10">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/[0.07] text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb36d]">
                <tr>
                  {["Country", "Tuition", "Living", "Work while studying", "After graduation", ""].map((heading) => (
                    <th key={heading} className="px-5 py-4">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {countries.map((country) => (
                  <tr key={country.slug} className="transition hover:bg-white/[0.04]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <FlagMark country={country} className="h-6 w-9" />
                        <span className="font-black">{country.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-white/85">{country.quickFacts.tuition}</td>
                    <td className="px-5 py-4 font-semibold text-white/85">{country.quickFacts.living}</td>
                    <td className="px-5 py-4 font-semibold text-white/85">{country.quickFacts.work}</td>
                    <td className="px-5 py-4 font-semibold text-white/85">{country.quickFacts.postStudy}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/countries/${country.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4b12] px-4 py-2 text-xs font-black text-white transition hover:bg-[#ff642f]"
                      >
                        Guide
                        <ArrowUpRight size={14} strokeWidth={3} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <DripDivider color="#071f50" background="#fff7ed" />

      {/* Important notes + Erasmus Mundus */}
      <section className="px-4 py-10 sm:px-5 md:py-16">
        <div className="mx-auto grid max-w-[1350px] gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 md:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                <AlertTriangle size={22} strokeWidth={2.6} />
              </div>
              <h2 className="text-2xl font-black tracking-[-0.04em]">What the EU does not mean</h2>
            </div>
            <ul className="mt-6 space-y-3">
              {euHub.importantNotes.map((note) => (
                <li key={note} className="flex gap-3 text-sm font-semibold leading-6 text-[#61708a]">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#ff4b12]" />
                  {note}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-[30px] bg-[#003399] p-6 text-white shadow-[0_24px_65px_rgba(0,51,153,0.25)] md:p-8">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border-[30px] border-[#ffcc00]/15" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffcc00]">Fully funded</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{euHub.erasmusMundus.title}</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-white/80">{euHub.erasmusMundus.text}</p>
            <a
              href={euHub.erasmusMundus.link}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ffcc00] px-5 py-3 text-xs font-black text-[#003399] transition hover:-translate-y-0.5"
            >
              Browse the official catalogue
              <ArrowUpRight size={14} strokeWidth={3} />
            </a>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-4 pb-16 sm:px-5">
        <div className="mx-auto max-w-[1000px]">
          <SectionHeader eyebrow="FAQs" title="EU study questions." />
          <div className="mt-10 space-y-3">
            {euHub.faqs.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div key={faq.q} className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_40px_rgba(9,31,80,0.06)] ring-1 ring-orange-100">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
                    aria-expanded={open}
                  >
                    <span className="text-base font-black tracking-[-0.02em]">{faq.q}</span>
                    <ChevronDown size={20} className={`shrink-0 text-[#ff4b12] transition ${open ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <p className="px-5 pb-5 text-sm font-semibold leading-7 text-[#61708a] md:px-6">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick links to each country */}
      <section className="px-4 pb-12 sm:px-5">
        <div className="mx-auto flex max-w-[1350px] flex-wrap justify-center gap-3">
          {countries.map((country) => (
            <Link
              key={country.slug}
              to={`/countries/${country.slug}`}
              className="group inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-black shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:text-[#ff4b12]"
            >
              <FlagMark country={country} className="h-5 w-[30px]" />
              Study in {country.name}
              <ArrowRight size={14} strokeWidth={3} className="transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <ConsultationBand
        title="Not sure which EU country fits?"
        text="Tell us your budget, grades and career goal. We'll compare Italy, Germany, France, Belgium, Romania and Lithuania for you."
        to="/appointment?country=European%20Union&service=Study%20Planning"
        label="Compare EU options with us"
      />
    </main>
  );
}

export default EuHubPage;
