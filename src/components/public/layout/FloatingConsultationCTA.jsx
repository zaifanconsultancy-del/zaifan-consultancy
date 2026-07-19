import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, MessageCircle, Sparkles, X } from "lucide-react";

const WHATSAPP_NUMBER = "923305718131";

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const hiddenRoutes = [
  "/appointment",
  "/contact",
  "/admin",
  "/student",
  "/counselor",
];

function FloatingConsultationCTA() {
  const location = useLocation();

  const [closed, setClosed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem("zaifan-floating-cta-closed") === "true";
  });

  useEffect(() => {
    setClosed(
      window.sessionStorage.getItem("zaifan-floating-cta-closed") === "true"
    );
  }, [location.pathname]);

  const routeHidden = hiddenRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  const handleClose = () => {
    setClosed(true);
    window.sessionStorage.setItem("zaifan-floating-cta-closed", "true");
  };

  const whatsappMessage = encodeURIComponent(
    "Hi Zaifan Consultancy, I want Italy study guidance for universities, scholarships and visa planning."
  );

  return (
    <AnimatePresence>
      {!closed && !routeHidden && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{
            duration: MOTION.duration,
            ease: MOTION.ease,
          }}
          className="fixed bottom-5 right-5 z-[9990] hidden sm:block"
        >
          <div className="relative max-w-[310px] rounded-[1.7rem] bg-white p-4 shadow-[0_22px_55px_rgba(7,31,80,0.18)] ring-1 ring-orange-100">
            <button
              type="button"
              onClick={handleClose}
              className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-[#071f50] text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"
              aria-label="Close consultation prompt"
            >
              <X size={15} strokeWidth={3} />
            </button>

            <div className="flex gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                <CalendarDays size={22} />
              </div>

              <div>
                <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">
                  <Sparkles size={12} />
                  Free Guidance
                </p>

                <h3 className="mt-1 text-base font-black leading-tight text-[#071f50]">
                  Need help choosing Italy?
                </h3>

                <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                  Get university, DSU scholarship and visa roadmap guidance.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                to="/appointment?country=Italy&service=Free%20Italy%20Study%20Plan"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-3 text-xs font-black text-white transition duration-300 hover:-translate-y-1 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"
              >
                Book Free
              </Link>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-green-500 px-4 py-3 text-xs font-black text-white transition duration-300 hover:-translate-y-1 hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-100"
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingConsultationCTA;
