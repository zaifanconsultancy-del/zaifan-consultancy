import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, Check, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { FlagMark } from "../destinations/DestinationUI";

const WHATSAPP_NUMBER = "923305718131";
const PREPARE = ["Your latest grades (matric, FSc, degree)", "What your family can spend per year", "The subject you want to study", "When you'd like to start"];

/** The end of the Countries page: three ways to get a person to help choose. */
function TalkToUs({ picks }) {
  const names = picks.map((country) => country.name);
  const message = names.length
    ? `Hi Zaifan, I'm interested in studying in ${names.join(", ")}. Can you help me choose?`
    : "Hi Zaifan, I'm not sure which country to choose. Can you help me?";

  const options = [
    {
      icon: FaWhatsapp,
      title: "Message us on WhatsApp",
      text: names.length ? `We'll get your shortlist (${names.join(", ")}) straight away.` : "Send us a message any time and we'll reply with next steps.",
      cta: "Open WhatsApp",
      href: `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`,
      external: true,
      tone: "bg-[#25d366] text-[#062b16] hover:bg-[#3ee07a]",
      iconTone: "bg-[#25d366] text-white",
    },
    {
      icon: CalendarCheck,
      title: "Book a free consultation",
      text: "Pick a time that suits you. We look at your profile and tell you honestly which two or three countries fit.",
      cta: "Choose a time",
      to: `/appointment?service=Free%20Consultation${names.length ? `&country=${encodeURIComponent(names[0])}` : ""}`,
      tone: "bg-[#ff4b12] text-white hover:bg-[#ff642f]",
      iconTone: "bg-[#ff4b12] text-white",
    },
    {
      icon: Phone,
      title: "Call us",
      text: "Prefer to talk? Call our team in Peshawar on 0330 5718131.",
      cta: "Call now",
      href: "tel:+923305718131",
      tone: "bg-[#071f50] text-white hover:bg-[#0b2a6b]",
      iconTone: "bg-[#071f50] text-white",
    },
  ];

  return (
    <section className="bg-[#fff7ed] px-4 pb-24 pt-12 text-[#071f50] sm:px-5 md:pb-32 md:pt-16">
      <div className="mx-auto max-w-[1350px]">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff4b12]">Still can&apos;t pick?</p>
            <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
              Talk to a real person.
              <span className="block text-[#ff4b12]">It&apos;s free.</span>
            </h2>
          </div>
          {picks.length > 0 && (
            <div className="rounded-2xl bg-white p-4 ring-1 ring-orange-100">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Your shortlist</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {picks.map((country) => (
                  <span key={country.slug} className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7ed] px-2.5 py-1 text-xs font-black">
                    <FlagMark country={country} className="h-3 w-[18px] rounded-[2px] shadow-none" /> {country.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {options.map((option, index) => {
            const button = (
              <>
                {option.cta} <ArrowRight size={16} strokeWidth={3} />
              </>
            );
            const buttonClass = `mt-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black transition ${option.tone}`;
            return (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="flex flex-col rounded-[28px] bg-white p-6 shadow-[0_20px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${option.iconTone}`}>
                  <option.icon size={22} />
                </span>
                <h3 className="mt-5 text-2xl font-black tracking-[-0.04em]">{option.title}</h3>
                <p className="mb-6 mt-2 text-sm font-semibold leading-6 text-[#5f6f89]">{option.text}</p>
                {option.to ? (
                  <Link to={option.to} className={buttonClass}>
                    {button}
                  </Link>
                ) : (
                  <a href={option.href} target={option.external ? "_blank" : undefined} rel={option.external ? "noreferrer" : undefined} className={buttonClass}>
                    {button}
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 rounded-[24px] border-2 border-dashed border-orange-200 p-5 sm:p-6">
          <p className="text-sm font-black">Have these ready and the chat takes 15 minutes:</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PREPARE.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm font-semibold text-[#5f6f89]">
                <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-500" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default TalkToUs;
