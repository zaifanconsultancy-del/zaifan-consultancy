import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

function AnalyticsSectionWrapper({
  id,
  title,
  eyebrow,
  children,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="scroll-mt-28 space-y-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex w-full items-center justify-between gap-4 rounded-[1.7rem] border-2 border-orange-300 bg-[#fffaf2] px-5 py-4 text-left shadow-[0_8px_24px_rgba(15,35,63,0.05)] transition duration-300 hover:border-orange-500 hover:bg-orange-50"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-700">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-xl font-black text-[#10233f] sm:text-2xl">
            {title}
          </h3>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-orange-300 bg-white text-orange-700 shadow-sm transition duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
          <ChevronDown size={20} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-[1.8rem] border border-slate-300 bg-white p-1 shadow-[0_8px_22px_rgba(15,35,63,0.035)]">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default AnalyticsSectionWrapper;