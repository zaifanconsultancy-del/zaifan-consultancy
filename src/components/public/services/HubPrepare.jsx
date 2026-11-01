import { Link } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import StepIntro from "../guide/StepIntro";
import PackingList from "./PackingList";
import ServiceFaq from "./ServiceFaq";
import { COUNTERS, HUB_STEPS, counterLabel, whatsappLink } from "./serviceMeta";

const ALL_FAQS = COUNTERS.flatMap((service) =>
  service.faqs.map(([q, a]) => ({ q, a, tag: `${counterLabel(service)} · ${service.shortTitle}` })),
);

/** Step 4 of the hub: pack for your first call, then the questions people ask before booking. */
function HubPrepare({ selected, onSelect }) {
  const service = COUNTERS.find((item) => item.slug === selected) || COUNTERS[0];

  return (
    <section id="prepare" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-24 pt-10 text-[#071f50] sm:px-5 md:pb-32 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          steps={HUB_STEPS}
          step={4}
          title="Pack for your first call."
          accent="Then book it, free."
          text="Each counter works better when you bring a few things. You don't need all of them to book."
          howTo="Pick a counter, tick what you already have, then book or send the list to us on WhatsApp."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-10">
          <div role="group" aria-label="Choose a counter" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
            {COUNTERS.map((item) => {
              const active = item.slug === service.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => onSelect(item.slug)}
                  aria-pressed={active}
                  className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                    active ? "bg-[#071f50] text-white" : "bg-white ring-1 ring-orange-100 hover:ring-[#ff4b12]/40"
                  }`}
                >
                  <span className={`font-mono text-xs ${active ? "text-[#ffb36d]" : "text-[#ff4b12]"}`}>
                    {String(item.counter).padStart(2, "0")}
                  </span>
                  {item.title}
                </button>
              );
            })}
          </div>

          <PackingList key={service.slug} service={service} />
        </div>

        <div className="mt-20 grid gap-8 border-t-2 border-dashed border-[#071f50]/10 pt-14 lg:grid-cols-[360px_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Questions</p>
            <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-5xl">
              Before you book, <span className="text-[#ff4b12]">answered.</span>
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#5f6f89]">
              {ALL_FAQS.length} questions students ask about our six counters. Still stuck? Ask a real person, free.
            </p>
            <div className="mt-6 grid gap-2.5">
              <a
                href={whatsappLink("Hi Zaifan, I have a question about your services.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3.5 text-sm font-black text-[#062b16] transition hover:bg-[#3ee07a]"
              >
                <FaWhatsapp size={17} /> Ask on WhatsApp
              </a>
              <Link
                to="/appointment?service=Free%20Consultation"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff642f]"
              >
                <CalendarCheck size={17} /> Book a free consultation
              </Link>
            </div>
          </div>
          <ServiceFaq faqs={ALL_FAQS} />
        </div>
      </div>
    </section>
  );
}

export default HubPrepare;
