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
        className="group flex w-full items-center justify-between gap-4 rounded-[1.7rem] border border-white/10 bg-white/[0.035] px-5 py-4 text-left backdrop-blur-xl transition duration-300 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
            {eyebrow}
          </p>

          <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">
            {title}
          </h3>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-[#D4AF37] transition duration-300 ${
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
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-1">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default AnalyticsSectionWrapper;