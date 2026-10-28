import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

import { serviceCatalog } from "../../../data/servicesData";

// The free consultation has its own booking form further down the page.
const SERVICES = serviceCatalog.filter((service) => service.slug !== "free-consultation");
// Bento layout on a 6-column grid: three across, then two wider tiles.
const SPANS = ["lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-3", "lg:col-span-3"];

/** What Zaifan does for a student, one tile per service. */
function ServicesBento() {
  return (
    <section id="services" className="scroll-mt-24 bg-[#fff7ed] px-4 py-16 text-[#071f50] sm:px-5 md:py-24">
      <div className="mx-auto max-w-[1350px]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff4b12]">What we do for you</p>
            <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
              From &ldquo;where?&rdquo;
              <span className="block text-[#ff4b12]">to &ldquo;I&apos;m in.&rdquo;</span>
            </h2>
          </div>
          <p className="max-w-md text-sm font-semibold leading-7 text-[#5f6f89] md:text-base">
            Pick only what you need, or let us handle the whole journey. Every service starts with a free, honest conversation.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {SERVICES.map((service, index) => {
            const wide = index >= 3;
            return (
              <motion.div
                key={service.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: (index % 3) * 0.07 }}
                className={`${SPANS[index]} ${index === SERVICES.length - 1 ? "sm:col-span-2 lg:col-span-3" : ""}`}
              >
                <Link
                  to={`/services/${service.slug}`}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-[26px] p-6 ring-1 transition duration-300 hover:-translate-y-1 ${
                    index === 4
                      ? "bg-[#071f50] text-white ring-[#071f50] hover:shadow-[0_26px_60px_rgba(7,31,80,0.3)]"
                      : "bg-white ring-orange-100 hover:shadow-[0_26px_60px_rgba(255,75,18,0.14)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl transition group-hover:-rotate-6 ${
                        index === 4 ? "bg-[#ff4b12] text-white" : "bg-[#fff1ea] text-[#ff4b12]"
                      }`}
                    >
                      <service.icon size={22} />
                    </span>
                    <span className={`font-mono text-xs font-black ${index === 4 ? "text-white/35" : "text-[#c9d0dc]"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-black tracking-[-0.04em]">{service.title}</h3>
                  <p className={`mt-2 text-sm font-semibold leading-6 ${index === 4 ? "text-white/70" : "text-[#5f6f89]"}`}>{service.hero}</p>

                  <ul className={`mt-5 grid gap-2 ${wide ? "sm:grid-cols-2" : ""}`}>
                    {service.outcomes.slice(0, wide ? 4 : 3).map((outcome) => (
                      <li key={outcome} className="flex items-start gap-2 text-xs font-bold leading-5">
                        <Check size={14} strokeWidth={3.5} className="mt-0.5 shrink-0 text-emerald-500" />
                        {outcome}
                      </li>
                    ))}
                  </ul>

                  <span className={`mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-black ${index === 4 ? "text-[#ffb36d]" : "text-[#ff4b12]"}`}>
                    How it works <ArrowUpRight size={15} strokeWidth={3} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-[26px] border-2 border-dashed border-orange-200 p-5 sm:flex-row sm:items-center">
          <p className="text-sm font-bold text-[#5f6f89]">
            <span className="font-black text-[#071f50]">Not sure what you need?</span> That&apos;s what the free consultation is for.
          </p>
          <a
            href="#apply"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ff4b12] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#ff642f]"
          >
            Book it free <ArrowRight size={16} strokeWidth={3} />
          </a>
        </div>
      </div>
    </section>
  );
}

export default ServicesBento;
