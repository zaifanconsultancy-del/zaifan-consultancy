// AnalyticsSectionWrapper — compact Intelligence module frame
// Keeps the existing API and disclosure behavior while avoiding a second
// dashboard-sized command header above child intelligence modules.

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { useId, useState } from "react";

function AnalyticsSectionWrapper({
  id,
  title,
  eyebrow,
  children,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const shouldReduceMotion = useReducedMotion();
  const generatedId = useId();

  const safeId =
    id || `analytics-section-${generatedId.replace(/:/g, "")}`;

  const buttonId = `${safeId}-toggle`;
  const panelId = `${safeId}-panel`;

  return (
    <section id={safeId} className="scroll-mt-28 space-y-3">
      <div className="flex flex-col gap-3 rounded-[1.35rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700">
            <LayoutDashboard size={16} />
          </span>

          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-orange-700">
              {eyebrow || "Intelligence Module"}
            </p>
            <h3 className="mt-0.5 truncate text-base font-black text-[#10233F] sm:text-lg">
              {title}
            </h3>
          </div>
        </div>

        <motion.button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          className="inline-flex min-h-10 items-center gap-2 self-start rounded-xl border-2 border-[#123865] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#123865] transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 sm:self-auto"
        >
          {open ? "Collapse" : "Open"}
          <ChevronDown
            size={15}
            className={`transition duration-200 ${open ? "rotate-180" : ""}`}
          />
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, height: 0, y: -4 }
            }
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0, y: -4 }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="overflow-hidden"
          >
            <div className="overflow-hidden rounded-[1.55rem] border-[3px] border-[#D1DCE7] bg-white p-1.5 shadow-[0_10px_26px_rgba(15,35,63,0.04)] sm:p-2">
              <div className="overflow-hidden rounded-[1.25rem] bg-[#FFF8EF]">
                {children}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default AnalyticsSectionWrapper;