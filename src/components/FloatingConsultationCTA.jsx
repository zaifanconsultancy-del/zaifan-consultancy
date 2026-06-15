import { Link, useLocation } from "react-router-dom";
import { CalendarDays, MessageCircle, Sparkles, X } from "lucide-react";
import { useState } from "react";

function FloatingConsultationCTA() {
  const location = useLocation();
  const [closed, setClosed] = useState(false);

  const hiddenRoutes = ["/appointment", "/admin", "/student", "/counselor"];

  const shouldHide =
    closed || hiddenRoutes.some((route) => location.pathname.startsWith(route));

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9990] hidden sm:block">
      <div className="relative max-w-[310px] rounded-[1.7rem] bg-white/95 p-4 shadow-[0_22px_55px_rgba(7,31,80,0.18)] ring-1 ring-orange-100 backdrop-blur">
        <button
          type="button"
          onClick={() => setClosed(true)}
          className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-[#071f50] text-white shadow-lg transition hover:bg-orange-600"
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
            to="/appointment?country=Italy&service=Free Italy Study Plan"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
          >
            Book Free
          </Link>

          <a
            href="https://wa.me/923001234567?text=Hi%20Zaifan%20Consultancy%2C%20I%20want%20Italy%20study%20guidance."
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-green-500 px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-green-600"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default FloatingConsultationCTA;