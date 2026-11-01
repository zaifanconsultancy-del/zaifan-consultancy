import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import PackingList from "./PackingList";
import ServiceFaq from "./ServiceFaq";
import { COUNTERS, DETAIL_STEPS } from "./serviceMeta";

/** Step 4 of a service page: pack for the call, the usual questions, and the other counters. */
function ReadyDesk({ service }) {
  const faqs = service.faqs.map(([q, a]) => ({ q, a }));
  const others = COUNTERS.filter((item) => item.slug !== service.slug);

  return (
    <section id="ready" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-24 pt-10 text-[#071f50] sm:px-5 md:pb-32 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          steps={DETAIL_STEPS}
          step={4}
          title="Get ready for your call."
          accent="Then book it, free."
          text="Bring what you have. Missing things are fine; we'll tell you where to get them."
          howTo="Tick what you already have, then book or send the list to us on WhatsApp."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <PackingList service={service} />

          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Questions about {service.shortTitle}</p>
            <div className="mt-4">
              <ServiceFaq faqs={faqs} />
            </div>
            {service.secondaryHref && service.secondaryHref !== "/services" && (
              <Link
                to={service.secondaryHref}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#071f50] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff4b12]"
              >
                {service.secondaryCta} <ArrowUpRight size={16} strokeWidth={3} />
              </Link>
            )}
          </div>
        </div>

        <div className="mt-20 border-t-2 border-dashed border-[#071f50]/10 pt-12">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h2 className="text-3xl font-black tracking-[-0.05em] md:text-4xl">
              The other <span className="text-[#ff4b12]">five counters.</span>
            </h2>
            <Link to="/services" className="text-sm font-black text-[#ff4b12] hover:underline">
              Back to all services
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {others.map((item) => (
              <Link
                key={item.slug}
                to={`/services/${item.slug}`}
                className="group flex flex-col rounded-[22px] bg-white p-4 ring-1 ring-orange-100 transition hover:-translate-y-1 hover:ring-[#ff4b12]/40"
              >
                <span className="flex items-center justify-between">
                  <span className="rounded-lg bg-[#071f50] px-2.5 py-1.5 font-mono text-[10px] font-black tracking-[0.12em] text-[#ffb36d]">
                    {String(item.counter).padStart(2, "0")} · {item.code}
                  </span>
                  <ArrowUpRight size={16} strokeWidth={3} className="text-[#ff4b12] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
                <span className="mt-4 text-base font-black leading-tight">{item.title}</span>
                <span className="mt-1 text-xs font-semibold leading-5 text-[#5f6f89]">&ldquo;{item.problem}&rdquo;</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReadyDesk;
