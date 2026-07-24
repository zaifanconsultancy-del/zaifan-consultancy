// AnalyticsSectionWrapper V3 MAXIMUM — Admin OS Analytics Section Shell
// src/components/admin/AnalyticsSectionWrapper.jsx
//
// Maximum pass:
// - preserves current public API
// - accessible disclosure semantics
// - keyboard-safe button behavior
// - reduced-motion support
// - smoother open/close animation
// - stronger navy/orange/cream Admin OS hierarchy
// - explicit white text on navy surfaces
// - cleaner spacing and less visual blending
// - mobile-safe layout
// - keeps children mounted only while open, matching current behavior

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
    id ||
    `analytics-section-${generatedId.replace(/:/g, "")}`;

  const buttonId = `${safeId}-toggle`;
  const panelId = `${safeId}-panel`;

  const toggleOpen = () => {
    setOpen((current) => !current);
  };

  return (
    <section
      id={safeId}
      className="scroll-mt-28 space-y-3 sm:space-y-4"
    >
      <motion.button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggleOpen}
        whileTap={
          shouldReduceMotion ? undefined : { scale: 0.995 }
        }
        className={`group relative w-full overflow-hidden rounded-[1.8rem] border-[3px] text-left shadow-[0_10px_28px_rgba(15,35,63,0.055)] transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
          open
            ? "border-orange-400 bg-[#123866]"
            : "border-orange-300 bg-[#fffaf2] hover:border-orange-400 hover:bg-orange-50"
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition ${
                open
                  ? "border-white/25 bg-white/10 text-white"
                  : "border-orange-300 bg-white text-orange-700"
              }`}
            >
              <LayoutDashboard size={17} />
            </div>

            <div className="min-w-0">
              <p
                className={`text-[9px] font-black uppercase tracking-[0.18em] ${
                  open ? "text-white" : "text-orange-700"
                }`}
              >
                {eyebrow || "Analytics Section"}
              </p>

              <h3
                className={`mt-1 break-words text-lg font-black leading-tight sm:text-xl ${
                  open ? "text-white" : "text-[#10233f]"
                }`}
              >
                {title}
              </h3>

              <p
                className={`mt-1 text-[11px] font-semibold ${
                  open ? "text-white" : "text-slate-600"
                }`}
              >
                {open
                  ? "Expanded — click to collapse this analytics workspace."
                  : "Collapsed — click to open this analytics workspace."}
              </p>
            </div>
          </div>

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition duration-300 ${
              open
                ? "rotate-180 border-white/25 bg-white/10 text-white"
                : "rotate-0 border-orange-300 bg-white text-orange-700 group-hover:border-orange-400"
            }`}
            aria-hidden="true"
          >
            <ChevronDown size={19} />
          </div>
        </div>

        {open ? (
          <div className="h-[3px] w-full bg-orange-500" />
        ) : null}
      </motion.button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={
              shouldReduceMotion
                ? false
                : {
                    opacity: 0,
                    height: 0,
                    y: -6,
                  }
            }
            animate={{
              opacity: 1,
              height: "auto",
              y: 0,
            }}
            exit={
              shouldReduceMotion
                ? {
                    opacity: 0,
                  }
                : {
                    opacity: 0,
                    height: 0,
                    y: -6,
                  }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="overflow-hidden"
          >
            <div className="rounded-[1.8rem] border-[3px] border-slate-300 bg-white p-1.5 shadow-[0_10px_26px_rgba(15,35,63,0.04)] sm:p-2">
              <div className="overflow-hidden rounded-[1.45rem] bg-[#fffaf4]">
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
