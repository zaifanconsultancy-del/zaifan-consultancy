import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";
import { ArrowRight, ArrowUp, Mail, MapPin, Phone, Plane } from "lucide-react";

// The logo with its navy lettering turned white, for dark backgrounds.
import logo from "../../../assets/images/brand/logo-light.webp";
import { countryIndex as countryList } from "../../../data/countries/countryIndex";
import { DripDivider, FlagMark, ZAIFAN_NAVY } from "../destinations/DestinationUI";

const WHATSAPP_NUMBER = "923305718131";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hello Zaifan Consultancy, I want to book a free study abroad consultation."
)}`;
const YEAR = new Date().getFullYear();

const SOCIALS = [
  { name: "Instagram", href: "https://www.instagram.com/zaifanconsultancy/", icon: FaInstagram, hover: "hover:bg-[linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)]" },
  { name: "TikTok", href: "https://www.tiktok.com/@zaifanconsultancy", icon: FaTiktok, hover: "hover:bg-black" },
  { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61593038991383", icon: FaFacebookF, hover: "hover:bg-[#1877f2]" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/zaifan-counsultancy/", icon: FaLinkedinIn, hover: "hover:bg-[#0a66c2]" },
  { name: "WhatsApp", href: WHATSAPP_LINK, icon: FaWhatsapp, hover: "hover:bg-[#25d366]" },
];

const EXPLORE = [
  { name: "Home", to: "/" },
  { name: "Countries", to: "/countries" },
  { name: "Universities", to: "/universities" },
  { name: "Scholarships", to: "/scholarships" },
  { name: "Services", to: "/services" },
  { name: "Study in the EU", to: "/countries/european-union" },
  { name: "Contact", to: "/contact" },
  { name: "Student login", to: "/student" },
];

const CONTACTS = [
  { icon: Phone, label: "Call", value: "0330 5718131", href: "tel:+923305718131" },
  { icon: FaWhatsapp, label: "WhatsApp", value: "+92 330 5718131", href: WHATSAPP_LINK, external: true },
  { icon: Mail, label: "Email", value: "zaifanconsultancy@gmail.com", href: "mailto:zaifanconsultancy@gmail.com" },
  { icon: MapPin, label: "Office", value: "Peshawar, Pakistan" },
];

const WORDMARK = "ZAIFAN".split("");

/**
 * ZAIFAN in solid orange, spread edge to edge. Each letter takes its slice of
 * one continuous gradient, rises in when the footer scrolls into view and
 * lifts on hover.
 */
function Wordmark() {
  return (
    <motion.div
      aria-hidden="true"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ staggerChildren: 0.07 }}
      className="flex select-none justify-between overflow-hidden pt-4"
    >
      {WORDMARK.map((letter, index) => (
        <motion.span
          key={index}
          variants={{ hidden: { y: "110%" }, show: { y: "0%" } }}
          transition={{ type: "spring", stiffness: 160, damping: 18 }}
          whileHover={{ y: -14, rotate: index % 2 ? 3 : -3 }}
          className="inline-block bg-[linear-gradient(90deg,#ffb36d,#ff7b1c,#ff4b12)] bg-clip-text text-[clamp(4rem,21vw,19.5rem)] font-black leading-[0.82] tracking-[-0.04em] text-transparent"
          style={{
            backgroundSize: `${WORDMARK.length * 100}% 100%`,
            backgroundPosition: `${(index / (WORDMARK.length - 1)) * 100}% 0`,
          }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
}

function ColumnTitle({ children }) {
  return <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff7b1c]">{children}</h3>;
}

function Footer() {
  return (
    <>
      {/* The footer rises out of every page with the same rounded top. */}
      <DripDivider background={ZAIFAN_NAVY} />
      <footer className="relative overflow-hidden bg-[#071f50] px-4 pb-8 pt-10 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-[#ff4b12]/12 blur-[130px]" />
        <div className="pointer-events-none absolute -right-40 bottom-20 h-[420px] w-[420px] rounded-full bg-[#ffb36d]/10 blur-[130px]" />

        <div className="relative mx-auto max-w-[1400px]">
          {/* Call to action */}
          <div className="grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb36d] ring-1 ring-white/10">
                <Plane size={14} /> Ready for take-off?
              </p>
              <h2 className="mt-5 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                Your degree abroad starts with <span className="text-[#ff7b1c]">one message.</span>
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#25d366] px-7 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(37,211,102,0.25)] transition hover:-translate-y-1"
              >
                <FaWhatsapp size={19} /> Chat on WhatsApp
              </a>
              <Link
                to="/appointment?service=Free%20Consultation"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#ff4b12] px-7 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
              >
                Book a free consultation <ArrowRight size={17} strokeWidth={3} />
              </Link>
            </div>
          </div>

          {/* Columns */}
          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.7fr_1fr_1.1fr]">
            <div>
              <Link to="/" className="inline-block transition hover:opacity-90" aria-label="Zaifan Consultancy home">
                <img src={logo} alt="Zaifan Consultancy" width="340" height="115" className="h-auto w-[210px]" loading="lazy" decoding="async" />
              </Link>
              <p className="mt-5 text-2xl font-black tracking-[-0.04em]">
                Your dream, <span className="text-[#ff7b1c]">our support.</span>
              </p>
              <p className="mt-3 max-w-sm text-sm font-semibold leading-7 text-white/65">
                Honest study-abroad guidance for Pakistani students: countries, universities, scholarships and visas, all in one plan.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {SOCIALS.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Zaifan Consultancy on ${social.name}`}
                    title={social.name}
                    className={`grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.08] text-white ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:ring-transparent ${social.hover}`}
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            <nav aria-label="Footer">
              <ColumnTitle>Explore</ColumnTitle>
              <ul className="mt-5 space-y-2.5">
                {EXPLORE.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="group inline-flex items-center gap-2 text-sm font-bold text-white/75 transition hover:text-white">
                      <span className="h-px w-0 bg-[#ff7b1c] transition-all duration-300 group-hover:w-4" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <ColumnTitle>Destinations</ColumnTitle>
              <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                {countryList.map((country) => (
                  <li key={country.slug}>
                    <Link
                      to={`/countries/${country.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-white/75 transition hover:translate-x-0.5 hover:text-white"
                    >
                      <FlagMark country={country} className="h-3.5 w-5 rounded-[3px] shadow-none" />
                      {country.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <ColumnTitle>Get in touch</ColumnTitle>
              <ul className="mt-5 space-y-3.5">
                {CONTACTS.map((item) => {
                  const body = (
                    <>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.08] text-[#ff7b1c] ring-1 ring-white/10">
                        <item.icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/45">{item.label}</span>
                        <span className="block truncate text-sm font-black">{item.value}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={item.label}>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noreferrer" : undefined}
                          className="flex items-center gap-3 transition hover:text-[#ffb36d]"
                        >
                          {body}
                        </a>
                      ) : (
                        <div className="flex items-center gap-3">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <Wordmark />

          {/* Bottom bar */}
          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs font-semibold text-white/50 sm:flex-row">
            <p>© {YEAR} Zaifan Consultancy. All rights reserved.</p>
            <p className="flex items-center gap-2">
              Made in Peshawar for students everywhere <span className="text-[#ff7b1c]">✈</span>
            </p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 font-black text-white ring-1 ring-white/10 transition hover:bg-[#ff4b12]"
            >
              Back to top
              <ArrowUp size={14} strokeWidth={3} className="transition group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
