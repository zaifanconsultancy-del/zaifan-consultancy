import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, CalendarCheck, Check, Mail, MessageSquareText, Phone, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { EMAIL, PHONE_DISPLAY, PHONE_HREF, whatsappLink } from "./contactInfo";

const OPTIONS = [
  {
    id: "question",
    icon: MessageSquareText,
    label: "Desk A",
    title: "Ask a question",
    text: "Send us a message. An advisor writes back or calls you.",
    rows: [
      ["Best when", "You have a question, or want a plan by message"],
      ["You pick a date", false],
      ["Form takes", "About 1 minute"],
    ],
    cta: "Write to us",
  },
  {
    id: "booking",
    icon: CalendarCheck,
    label: "Desk B",
    title: "Book a call time",
    text: "Choose a day and time for a free call with an advisor.",
    rows: [
      ["Best when", "You'd rather talk it all through"],
      ["You pick a date", true],
      ["Form takes", "About 2 minutes"],
    ],
    cta: "Book a time",
  },
];

function Row({ label, value, dark }) {
  return (
    <div className={`flex items-start justify-between gap-4 border-t py-2.5 text-sm ${dark ? "border-white/10" : "border-[#071f50]/10"}`}>
      <span className={`font-mono text-[10px] font-black uppercase leading-6 tracking-[0.14em] ${dark ? "text-white/50" : "text-[#7a879c]"}`}>{label}</span>
      {typeof value === "boolean" ? (
        <span className={`inline-flex items-center gap-1 font-black ${value ? "text-emerald-500" : dark ? "text-white/60" : "text-[#7a879c]"}`}>
          {value ? <Check size={15} strokeWidth={3.5} /> : <X size={15} strokeWidth={3.5} />} {value ? "Yes" : "No"}
        </span>
      ) : (
        <span className="text-right font-bold">{value}</span>
      )}
    </div>
  );
}

/**
 * Contact hero: an information desk with two counters, so visitors can see at
 * a glance whether they want to ask a question or book a call time.
 */
function ContactHero({ bookingHref }) {
  return (
    <section className="relative overflow-hidden bg-[#fff7ed] px-4 pb-16 pt-28 text-[#071f50] sm:px-5 md:pb-24 md:pt-36">
      <div className="relative mx-auto max-w-[1350px]">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-3.5 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[#ffb36d] text-[10px] text-[#071f50]">i</span> Information desk
            </span>
            <h1 className="mt-6 text-[3rem] font-black leading-[0.9] tracking-[-0.065em] sm:text-7xl xl:text-[5.6rem]">
              Talk to us.
              <span className="block text-[#ff4b12]">Two ways in.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-[#5f6f89]">
              Have a question? Write to us. Want to talk it through? Book a call time. Both are free, and both reach the same advisors.
            </p>
          </div>

          {/* Quick channels */}
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#25d366] px-5 py-3 text-sm font-black text-[#062b16] transition hover:bg-[#3ee07a]"
            >
              <FaWhatsapp size={17} /> WhatsApp now
            </a>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-3 text-sm font-black ring-1 ring-orange-100 transition hover:text-[#ff4b12]"
            >
              <Phone size={16} /> {PHONE_DISPLAY}
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex min-w-0 items-center gap-2.5 rounded-full bg-white px-5 py-3 text-sm font-black ring-1 ring-orange-100 transition hover:text-[#ff4b12]"
            >
              <Mail size={16} className="shrink-0" /> <span className="truncate">{EMAIL}</span>
            </a>
          </div>
        </div>

        <div className="relative mt-12 grid gap-4 md:grid-cols-2 md:gap-6">
          {OPTIONS.map((option, index) => {
            const dark = option.id === "booking";
            const Icon = option.icon;
            const body = (
              <>
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-xl px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] ${
                      dark ? "bg-[#ff4b12] text-white" : "bg-[#071f50] text-[#ffb36d]"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl transition group-hover:-rotate-6 ${dark ? "bg-white/10 text-[#ffb36d]" : "bg-[#fff1ea] text-[#ff4b12]"}`}>
                    <Icon size={22} />
                  </span>
                </div>
                <h2 className="mt-6 text-3xl font-black tracking-[-0.05em] md:text-4xl">{option.title}</h2>
                <p className={`mt-2 text-base font-semibold leading-7 ${dark ? "text-white/70" : "text-[#5f6f89]"}`}>{option.text}</p>
                <div className="mt-5">
                  {option.rows.map(([label, value]) => (
                    <Row key={label} label={label} value={value} dark={dark} />
                  ))}
                </div>
                <span
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-sm font-black transition ${
                    dark ? "bg-[#ff4b12] text-white group-hover:bg-[#ff642f]" : "bg-[#071f50] text-white group-hover:bg-[#ff4b12]"
                  }`}
                >
                  {option.cta} {dark ? <ArrowRight size={16} strokeWidth={3} /> : <ArrowDown size={16} strokeWidth={3} />}
                </span>
              </>
            );
            const className = `group flex h-full flex-col rounded-[30px] p-6 text-left transition hover:-translate-y-1 md:p-8 ${
              dark
                ? "bg-[#071f50] text-white shadow-[0_30px_70px_rgba(7,31,80,0.28)]"
                : "bg-white shadow-[0_26px_60px_rgba(7,31,80,0.1)] ring-1 ring-orange-100"
            }`;

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {dark ? (
                  <Link to={bookingHref} className={className}>
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.getElementById("write")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className={`${className} w-full`}
                  >
                    {body}
                  </button>
                )}
              </motion.div>
            );
          })}

          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 hidden h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#fff7ed] font-black text-[#ff4b12] ring-4 ring-[#fff7ed] md:grid"
          >
            <span className="grid h-full w-full place-items-center rounded-full bg-white text-sm ring-1 ring-orange-100">or</span>
          </span>
        </div>
      </div>
    </section>
  );
}

export default ContactHero;
