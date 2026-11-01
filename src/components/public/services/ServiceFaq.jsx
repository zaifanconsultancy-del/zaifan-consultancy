import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";

const PAGE_SIZE = 5;

/** Questions as an accordion, paged so a long list never becomes a wall. */
function ServiceFaq({ faqs }) {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(0);
  const pages = Math.ceil(faqs.length / PAGE_SIZE);
  const shown = faqs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const goToPage = (next) => {
    setPage(next);
    setOpen(-1);
  };

  return (
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
                <span>
                  {faq.tag && (
                    <span className="mb-1 block font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">{faq.tag}</span>
                  )}
                  <span className="block text-base font-black tracking-[-0.02em]">{faq.q}</span>
                </span>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
                    isOpen ? "rotate-45 bg-[#ff4b12] text-white" : "bg-[#fff1ea] text-[#ff4b12]"
                  }`}
                >
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
  );
}

export default ServiceFaq;
