import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarCheck, Plus } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { HonestyNote } from "../destinations/DestinationUI";

const PAGE_SIZE = 6;
const WHATSAPP_NUMBER = "923305718131";

/** Questions, paged so the list never becomes a wall, next to a way to ask a person. */
function GuideFaq({ country, appointmentPath }) {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(0);
  const pages = Math.ceil(country.faqs.length / PAGE_SIZE);
  const shown = country.faqs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const whatsapp = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(
    `Hi Zaifan, I have a question about studying in ${country.name}.`,
  )}`;

  const goToPage = (next) => {
    setPage(next);
    setOpen(-1);
  };

  return (
    <section id="faqs" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-24 pt-8 text-[#071f50] sm:px-5 md:pb-32">
      <div className="mx-auto grid max-w-[1350px] gap-8 border-t-2 border-dashed border-[#071f50]/10 pt-14 lg:grid-cols-[360px_1fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Questions</p>
          <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-5xl">
            {country.name}, <span className="text-[#ff4b12]">answered.</span>
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#5f6f89]">
            {country.faqs.length} questions Pakistani students ask us most. Still stuck? Ask a real person, free.
          </p>
          <div className="mt-6 grid gap-2.5">
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3.5 text-sm font-black text-[#062b16] transition hover:bg-[#3ee07a]"
            >
              <FaWhatsapp size={17} /> Ask on WhatsApp
            </a>
            <Link
              to={appointmentPath}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff642f]"
            >
              <CalendarCheck size={17} /> Book a free consultation
            </Link>
          </div>
        </div>

        <div>
          <div className="grid gap-3">
            {shown.map((faq, index) => {
              const isOpen = open === index;
              return (
                <div key={faq.q} className="overflow-hidden rounded-[22px] bg-white ring-1 ring-orange-100">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6 md:py-5"
                  >
                    <span className="text-base font-black tracking-[-0.02em]">{faq.q}</span>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${isOpen ? "rotate-45 bg-[#ff4b12] text-white" : "bg-[#fff1ea] text-[#ff4b12]"}`}>
                      <Plus size={16} strokeWidth={3} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                        <p className="px-5 pb-5 text-sm font-semibold leading-7 text-[#5f6f89] md:px-6">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {pages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page === 0}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black ring-1 ring-orange-100 transition hover:text-[#ff4b12] disabled:opacity-40"
              >
                <ArrowLeft size={16} strokeWidth={3} /> Previous
              </button>
              <span className="font-mono text-sm font-black text-[#7a879c]">
                Page {page + 1} of {pages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page === pages - 1}
                className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff4b12] disabled:opacity-40"
              >
                Next page <ArrowRight size={16} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </div>
      <HonestyNote lastReviewed={country.lastReviewed} sources={country.sources} />
    </section>
  );
}

export default GuideFaq;
