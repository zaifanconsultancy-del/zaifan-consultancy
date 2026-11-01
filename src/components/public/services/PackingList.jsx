import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarCheck, Check, Luggage, RotateCcw } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { appointmentHref, counterLabel, whatsappLink } from "./serviceMeta";

/**
 * A carry-on bag for your first call: tick what you already have. Missing
 * things don't stop you booking; the list just tells us where to start.
 */
function PackingList({ service }) {
  const [packed, setPacked] = useState({});
  const items = service.checklist;
  const count = items.filter((item) => packed[item]).length;
  const percent = (count / items.length) * 100;
  const toggle = (item) => setPacked((current) => ({ ...current, [item]: !current[item] }));

  const message = [
    `Hi Zaifan, I'd like help from ${counterLabel(service)}: ${service.title}.`,
    count ? `I already have: ${items.filter((item) => packed[item]).join("; ")}.` : "",
    count < items.length ? `Still missing: ${items.filter((item) => !packed[item]).join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="rounded-[30px] bg-white p-5 text-[#071f50] shadow-[0_26px_60px_rgba(7,31,80,0.1)] ring-1 ring-orange-100 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#071f50] text-[#ffb36d]">
            <Luggage size={22} />
          </span>
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]">Carry-on for {counterLabel(service)}</p>
            <p className="text-xl font-black tracking-[-0.03em]">{service.title}</p>
          </div>
        </div>
        {count > 0 && (
          <button
            type="button"
            onClick={() => setPacked({})}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black text-[#7a879c] transition hover:bg-[#fff1ea] hover:text-[#ff4b12]"
          >
            <RotateCcw size={13} strokeWidth={3} /> Reset
          </button>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between font-mono text-[11px] font-black uppercase tracking-[0.14em]">
          <span>
            {count} of {items.length} packed
          </span>
          <span className={count === items.length ? "text-emerald-600" : "text-[#7a879c]"}>
            {count === items.length ? "Ready to go" : count ? "Good start" : "Tap what you have"}
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#071f50]/[0.07]">
          <motion.div className="h-full rounded-full bg-emerald-500" animate={{ width: `${percent}%` }} transition={{ type: "spring", stiffness: 160, damping: 22 }} />
        </div>
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const done = Boolean(packed[item]);
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => toggle(item)}
                aria-pressed={done}
                className={`flex w-full items-start gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold leading-6 ring-1 transition ${
                  done ? "bg-emerald-50 text-emerald-900 ring-emerald-300" : "bg-[#fffaf5] ring-orange-100 hover:ring-[#ff4b12]/40"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition ${
                    done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[#c9d0dc] bg-white"
                  }`}
                >
                  {done && <Check size={13} strokeWidth={4} />}
                </span>
                {item}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-sm font-semibold leading-6 text-[#5f6f89]">
        Missing some? Book anyway. We start with what you have and tell you how to get the rest.
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <Link
          to={appointmentHref(service)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff642f]"
        >
          <CalendarCheck size={16} /> {service.primaryCta}
        </Link>
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3.5 text-sm font-black text-[#062b16] transition hover:bg-[#3ee07a]"
        >
          <FaWhatsapp size={17} /> Send my list on WhatsApp
        </a>
      </div>
    </div>
  );
}

export default PackingList;
