import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, Check, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { getCountryBySlug } from "../../../data/countries/countryRegistry";

const WHATSAPP_NUMBER = "923305718131";
const PREPARE = ["Your latest grades (matric, FSc, degree)", "Your English test score, if you have one", "What your family can spend per year", "When you'd like to start"];

/** The closing section: three ways to reach a person about these universities. */
function UniTalk({ universities = [], eyebrow = "Ready for the next step?", title = "Let us check if you'd get in.", accent = "It's free." }) {
  const names = universities.map((university) => university.name);
  const firstCountry = universities[0] ? getCountryBySlug(universities[0].countrySlug)?.name : "";
  const message = names.length
    ? `Hi Zaifan, I'm interested in ${names.join(", ")}. Can you check my chances and help me apply?`
    : "Hi Zaifan, I need help choosing a university. Can you help me?";

  const options = [
    {
      icon: FaWhatsapp,
      title: "Message us on WhatsApp",
      text: names.length ? `We'll get your list (${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""}) straight away.` : "Send us a message any time and we'll reply with next steps.",
      cta: "Open WhatsApp",
      href: `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`,
      external: true,
      tone: "bg-[#25d366] text-[#062b16] hover:bg-[#3ee07a]",
      iconTone: "bg-[#25d366] text-white",
    },
    {
      icon: CalendarCheck,
      title: "Book a free consultation",
      text: "We look at your grades, budget and goals, then tell you honestly which universities you can get into.",
      cta: "Choose a time",
      to: `/appointment?service=${encodeURIComponent("University Selection")}${firstCountry ? `&country=${encodeURIComponent(firstCountry)}` : ""}${
        names[0] ? `&university=${encodeURIComponent(names[0])}` : ""
      }`,
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
    <section className="bg-[#fff7ed] px-4 pb-24 pt-14 text-[#071f50] sm:px-5 md:pb-32 md:pt-20">
      <div className="mx-auto max-w-[1350px]">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff4b12]">{eyebrow}</p>
        <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
          {title}
          <span className="block text-[#ff4b12]">{accent}</span>
        </h2>

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

export default UniTalk;
