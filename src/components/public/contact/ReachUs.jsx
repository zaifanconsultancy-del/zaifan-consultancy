import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarCheck, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";

import { countryIndex as countryList } from "../../../data/countries/countryIndex";
import ServiceFaq from "../services/ServiceFaq";
import { EMAIL, OFFICE, PHONE_DISPLAY, PHONE_HREF, whatsappLink } from "./contactInfo";

const CHANNELS = [
  { icon: FaWhatsapp, label: "WhatsApp", value: "+92 330 5718131", note: "Fastest way to reach us", href: whatsappLink(), external: true, tone: "bg-[#25d366] text-[#062b16]" },
  { icon: Phone, label: "Call", value: PHONE_DISPLAY, note: "Talk to an advisor", href: PHONE_HREF, tone: "bg-[#071f50] text-white" },
  { icon: Mail, label: "Email", value: EMAIL, note: "Good for documents", href: `mailto:${EMAIL}`, tone: "bg-[#ff4b12] text-white" },
  { icon: MapPin, label: "Office", value: OFFICE, note: "Where we are", tone: "bg-white text-[#071f50] ring-1 ring-orange-100" },
];

const SOCIALS = [
  { name: "Instagram", href: "https://www.instagram.com/zaifanconsultancy/", icon: FaInstagram },
  { name: "TikTok", href: "https://www.tiktok.com/@zaifanconsultancy", icon: FaTiktok },
  { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61593038991383", icon: FaFacebookF },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/zaifan-counsultancy/", icon: FaLinkedinIn },
];

const FAQS = [
  {
    q: "Should I send a question or book a call?",
    a: "Send a question if you want an answer in writing or aren't ready to talk yet. Book a call if you want to go through your options with an advisor at a set time. You can do both.",
  },
  {
    q: "Which country is best for Pakistani students?",
    a: "It depends on your budget, subject and career plan. Germany suits engineering on a low tuition budget, Italy and France offer income-based support, Turkey and China have fully funded government scholarships, and Romania is popular for medicine. We compare them for your profile.",
  },
  {
    q: "Is the first consultation really free?",
    a: "Yes. Your first consultation is free. We review your grades, budget and goals and tell you honestly which options fit, including when a country doesn't.",
  },
  {
    q: "Do you guarantee admission, scholarships or visas?",
    a: "No, and nobody honestly can. Universities, scholarship bodies and embassies make those decisions. We make your application as strong and complete as possible.",
  },
  {
    q: "When should I start my application?",
    a: "Ideally 9–12 months before your course starts. Tests, document attestation, applications and visa appointments all take longer than most students expect.",
  },
  {
    q: "Can I study abroad with a 14-year degree?",
    a: "For many European master's programmes you need 16 years of education. Some countries and programmes are more flexible, so we check your exact case.",
  },
  {
    q: "Which documents should I prepare first?",
    a: "A valid passport, IBCC-attested school certificates, HEC-attested degree and transcripts (for master's), and an English test like IELTS. Those unlock most applications.",
  },
];

/** Every other way to reach Zaifan, then the questions people ask before getting in touch. */
function ReachUs({ bookingHref }) {
  return (
    <section className="bg-[#fff7ed] px-4 pb-24 pt-10 text-[#071f50] sm:px-5 md:pb-32 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Other ways in</p>
        <h2 className="mt-3 text-[2.4rem] font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl md:text-6xl">
          Prefer to just message?
          <span className="block text-[#ff4b12]">Go ahead.</span>
        </h2>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const body = (
              <>
                <span className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-black/10">
                    <Icon size={20} />
                  </span>
                  {channel.href && <ArrowUpRight size={18} strokeWidth={3} className="opacity-60 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
                </span>
                <span className="mt-6 block font-mono text-[10px] font-black uppercase tracking-[0.16em] opacity-60">{channel.label}</span>
                <span className="mt-1 block break-words text-lg font-black leading-tight">{channel.value}</span>
                <span className="mt-1 block text-xs font-bold opacity-70">{channel.note}</span>
              </>
            );
            const className = `group flex flex-col rounded-[24px] p-5 transition ${channel.tone} ${channel.href ? "hover:-translate-y-1" : ""}`;
            return channel.href ? (
              <a key={channel.label} href={channel.href} target={channel.external ? "_blank" : undefined} rel={channel.external ? "noreferrer" : undefined} className={className}>
                {body}
              </a>
            ) : (
              <div key={channel.label} className={className}>
                {body}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Follow us</span>
          {SOCIALS.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black ring-1 ring-orange-100 transition hover:text-[#ff4b12]"
            >
              <social.icon size={14} /> {social.name}
            </a>
          ))}
        </div>

        <div className="mt-20 grid gap-8 border-t-2 border-dashed border-[#071f50]/10 pt-14 lg:grid-cols-[360px_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Questions</p>
            <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-5xl">
              Before you start, <span className="text-[#ff4b12]">answered.</span>
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#5f6f89]">
              Straight answers about studying in {countryList.length} countries with Zaifan.
            </p>
            <Link
              to={bookingHref}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff642f]"
            >
              <CalendarCheck size={17} /> Book a free call time
            </Link>
          </div>
          <ServiceFaq faqs={FAQS} />
        </div>
      </div>
    </section>
  );
}

export default ReachUs;
