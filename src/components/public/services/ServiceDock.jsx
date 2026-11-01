import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarCheck, Check } from "lucide-react";

/** Floating dock: the steps of the page, where you are, and a way to book. */
function ServiceDock({ steps, active, bookHref, bookLabel = "Book free call" }) {
  const activeIndex = steps.findIndex((step) => step.id === active);

  return (
    <motion.nav
      aria-label="Page steps"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-x-0 bottom-4 z-[9990] flex justify-center px-3"
    >
      <div className="flex max-w-full items-center gap-1.5 rounded-full bg-[#071f50] p-1.5 text-white shadow-[0_24px_60px_rgba(7,31,80,0.45)] ring-1 ring-white/10">
        <ol className="flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {steps.map((step, index) => {
            const current = step.id === active;
            const passed = index < activeIndex;
            return (
              <li key={step.id} className="shrink-0">
                <a
                  href={`#${step.id}`}
                  aria-current={current ? "step" : undefined}
                  className={`relative flex items-center gap-1.5 rounded-full px-2 py-2 text-xs font-black transition sm:px-3 ${
                    current ? "text-white" : "text-white/55 hover:text-white"
                  }`}
                >
                  {current && <motion.span layoutId="service-dock-step" className="absolute inset-0 rounded-full bg-[#ff4b12]" />}
                  <span
                    className={`relative grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] ${
                      current ? "bg-white text-[#ff4b12]" : passed ? "bg-emerald-400 text-[#071f50]" : "bg-white/10"
                    }`}
                  >
                    {passed ? <Check size={11} strokeWidth={4} /> : index + 1}
                  </span>
                  <span className={`relative whitespace-nowrap ${current ? "" : "hidden lg:inline"}`}>{step.label}</span>
                </a>
              </li>
            );
          })}
        </ol>
        <span className="h-7 w-px shrink-0 bg-white/15" />
        <Link
          to={bookHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-black text-[#071f50] transition hover:bg-[#ffb36d]"
        >
          <CalendarCheck size={14} />
          <span className="hidden sm:inline">{bookLabel}</span>
        </Link>
      </div>
    </motion.nav>
  );
}

export default ServiceDock;
