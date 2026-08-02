import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaLinkedinIn,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaArrowRight,
  FaGraduationCap,
  FaPassport,
  FaUniversity,
  FaPlaneDeparture,
} from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";
import { Link } from "react-router-dom";

const whatsappNumber = "923305718131";
const whatsappMessage = encodeURIComponent(
  "Hello Zaifan Consultancy, I want to book a free study abroad consultation."
);

function buildAppointmentServiceLink(serviceTitle) {
  return `/appointment?country=Italy&service=${encodeURIComponent(serviceTitle)}`;
}

function Footer() {
  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Countries", href: "/countries" },
    { name: "Universities", href: "/universities" },
    { name: "Study in Italy", href: "/countries/italy" },
    { name: "Contact", href: "/contact" },
  ];

  const services = [
    { name: "All Services", href: "/services" },
    { name: "University Selection", href: "/appointment?country=Italy&service=Italy%20University%20Selection" },
    { name: "Scholarship Guidance", href: "/scholarships" },
    { name: "Admission Guidance", href: "/appointment?country=Italy&service=Italy%20Admission%20Guidance" },
    { name: "SOP & Documentation", href: "/appointment?country=Italy&service=SOP%20%26%20Documentation" },
    { name: "Visa Guidance", href: "/appointment?country=Italy&service=Italy%20Visa%20Guidance" },
  ];

  const destinations = [
    { name: "Italy", live: true, href: "/countries/italy" },
    { name: "United Kingdom", live: false },
    { name: "Canada", live: false },
    { name: "Australia", live: false },
    { name: "Germany", live: false },
    { name: "Turkey", live: false },
  ];

  const italyCities = [
    { name: "Milan", href: "/countries/italy/milan" },
    { name: "Rome", href: "/countries/italy/rome" },
    { name: "Bologna", href: "/countries/italy/bologna" },
    { name: "Padua", href: "/countries/italy/padua" },
    { name: "Florence", href: "/countries/italy/florence" },
    { name: "Turin", href: "/countries/italy/turin" },
    { name: "Pisa", href: "/countries/italy/pisa" },
    { name: "Venice", href: "/countries/italy/venice" },
  ];

  const highlights = [
    {
      icon: <FaUniversity />,
      title: "University Matching",
      text: "Find universities that fit your goals.",
    },
    {
      icon: <FaGraduationCap />,
      title: "Scholarship Routes",
      text: "Discover funding opportunities.",
    },
    {
      icon: <FaPassport />,
      title: "Visa Support",
      text: "Prepare your visa path clearly.",
    },
  ];

  const scrollToTop = (event) => {
    event.preventDefault();

    if (typeof window === "undefined") return;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="relative overflow-hidden bg-[#fff7ed] px-4 pb-8 pt-14 text-[#071b3a] sm:px-6 lg:px-8">
      <style>{`
        @keyframes footerTrailMove {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -170; }
        }

        @keyframes footerFloat {
          0%, 100% { transform: translateY(0px) rotate(-8deg); }
          50% { transform: translateY(-12px) rotate(4deg); }
        }

        .footer-trail {
          animation: footerTrailMove 9s linear infinite;
        }

        .footer-float {
          animation: footerFloat 4.8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .footer-trail,
          .footer-float {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-18%] h-[540px] w-[540px] rounded-full bg-orange-200/45 blur-3xl" />
        <div className="absolute right-[-12%] bottom-[-28%] h-[560px] w-[560px] rounded-full bg-orange-100/90 blur-3xl" />
        <div className="absolute left-[35%] top-[12%] h-32 w-32 rounded-full bg-white/80 blur-2xl" />

        <svg
          className="absolute left-0 top-4 h-[240px] w-full opacity-80"
          viewBox="0 0 1440 240"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            className="footer-trail"
            d="M-40 140 C130 35 270 185 455 82 C635 -18 765 180 955 82 C1145 -20 1285 85 1490 35"
            stroke="#fb923c"
            strokeWidth="2.8"
            strokeDasharray="10 14"
            strokeLinecap="round"
            opacity="0.72"
          />
          <path
            className="footer-trail"
            d="M120 210 C300 90 455 220 620 120 C790 15 950 230 1120 110 C1260 12 1360 70 1460 42"
            stroke="#fed7aa"
            strokeWidth="2.5"
            strokeDasharray="10 14"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>

        <div className="footer-float absolute left-[7%] top-7 hidden h-16 w-16 items-center justify-center rounded-3xl bg-white/80 text-orange-500 shadow-xl lg:flex">
          <FaPlaneDeparture className="h-8 w-8" />
        </div>

        <div className="absolute right-[8%] top-12 hidden h-20 w-28 rounded-full bg-white/75 shadow-[0_20px_60px_rgba(251,146,60,0.12)] lg:block">
          <div className="absolute left-5 top-5 h-10 w-10 rounded-full bg-white" />
          <div className="absolute left-10 top-2 h-14 w-14 rounded-full bg-white" />
          <div className="absolute right-4 top-6 h-9 w-9 rounded-full bg-white" />
        </div>

        <div className="absolute left-[45%] top-24 text-4xl text-orange-400">
          ✦
        </div>
        <div className="absolute right-[30%] bottom-28 text-3xl text-orange-300">
          ✦
        </div>
      </div>

      <div className="relative mx-auto max-w-[1500px]">
        <div className="overflow-hidden rounded-[2.7rem] border border-orange-100 bg-white/78 p-6 shadow-[0_34px_100px_rgba(251,146,60,0.18)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="mb-10 grid gap-4 lg:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="group rounded-[1.8rem] border border-orange-100 bg-gradient-to-br from-white to-orange-50/70 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(251,146,60,0.16)] focus-within:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/20 transition group-hover:scale-110">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-[#2d145f]">{item.title}</h4>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.45fr_0.8fr_0.95fr_0.9fr]">
            <div>
              <button
                type="button"
                onClick={scrollToTop}
                className="group inline-flex items-center gap-4 rounded-[1.8rem] text-left outline-none focus:ring-4 focus:ring-orange-100"
                aria-label="Back to top"
              >
                <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-orange-500 to-orange-700 text-4xl font-black text-white shadow-2xl shadow-orange-600/25 transition group-hover:-translate-y-1 group-hover:scale-105">
                  Z
                  <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs text-orange-600 shadow-md">
                    ✦
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-black text-[#2d145f]">
                    Zaifan Consultancy
                  </h2>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.28em] text-orange-600">
                    Study Abroad Guidance
                  </p>
                </div>
              </button>

              <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-slate-600">
                Helping students build a clear Italy study plan across
                universities, scholarships, documents and visa preparation —
                with more destinations added only when the guidance is ready.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/appointment?country=Italy&service=Free%20Italy%20Study%20Plan"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-7 py-4 font-black text-white shadow-xl shadow-orange-600/20 transition duration-300 hover:-translate-y-1 hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200"
                >
                  Book Consultation
                  <FaArrowRight className="text-sm" />
                </Link>

                <a
                  href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-300 bg-white px-7 py-4 font-black text-green-600 transition duration-300 hover:-translate-y-1 hover:bg-green-50 focus:outline-none focus:ring-4 focus:ring-green-100"
                >
                  <FaWhatsapp />
                  WhatsApp Us
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-3" aria-label="Social links">
                <SocialIcon icon={<FaFacebookF />} label="Facebook" disabled />
                <SocialIcon icon={<FaInstagram />} label="Instagram" disabled />
                <SocialIcon icon={<FaTiktok />} label="TikTok" disabled />
                <SocialIcon
                  icon={<FaWhatsapp />}
                  label="WhatsApp"
                  href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                  external
                />
                <SocialIcon icon={<FaLinkedinIn />} label="LinkedIn" disabled />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {["Free consultation", "Profile review", "Visa roadmap"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-orange-700 ring-1 ring-orange-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <FooterColumn title="Quick Links" items={quickLinks} links />

            <FooterColumn title="Services" items={services} />

            <FooterColumn title="Destinations" items={destinations} destinations italyCities={italyCities} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ContactCard
            icon={<FaPhoneAlt />}
            label="Phone"
            value="03305718131"
            sub="WhatsApp consultation available"
            href="tel:+923305718131"
            color="orange"
          />

          <ContactCard
            icon={<FaEnvelope />}
            label="Email"
            value="zaifanconsultancy@gmail.com"
            sub="Send documents or questions anytime"
            href="mailto:zaifanconsultancy@gmail.com"
            color="orange"
          />

          <ContactCard
            icon={<FaMapMarkerAlt />}
            label="Location"
            value="Pakistan"
            sub="Online consultation available"
            href="/appointment"
            internal
            color="green"
          />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-orange-100 pt-7 text-center text-sm font-semibold text-slate-500 md:flex-row">
          <p>© 2026 Zaifan Consultancy. All rights reserved.</p>

          <p>
            Built for every student chasing a{" "}
            <span className="font-black text-orange-600">
              global education dream.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items, links = false, destinations = false, italyCities = [] }) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.24em] text-orange-600">
        {title}
      </h3>

      <ul className="mt-6 space-y-3">
        {items.map((item) => {
          if (destinations) {
            if (!item.live) {
              return (
                <li key={item.name}>
                  <div className="inline-flex items-center gap-2 rounded-lg font-bold text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-200" />
                    <span>{item.name}</span>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-orange-700">
                      Soon
                    </span>
                  </div>
                </li>
              );
            }

            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className="group inline-flex items-center gap-2 rounded-lg font-black text-[#ff4b12] transition hover:translate-x-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff4b12]" />
                  🇮🇹 Italy
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black uppercase text-green-700">
                    Live
                  </span>
                </Link>
              </li>
            );
          }

          const name = typeof item === "string" ? item : item.name;
          const href =
            typeof item === "string"
              ? buildAppointmentServiceLink(item)
              : item.href;

          return (
            <li key={name}>
              <Link
                to={href}
                className="group inline-flex items-center gap-2 rounded-lg font-bold text-slate-600 transition duration-300 hover:translate-x-1 hover:text-orange-600"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-200 transition duration-300 group-hover:bg-orange-600" />
                {name}
              </Link>
            </li>
          );
        })}
      </ul>

      {destinations && italyCities.length > 0 && (
        <div className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-200" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">
              Italy City Guides
            </p>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-black uppercase text-green-700">
              8 Live
            </span>
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
            {italyCities.map((city) => (
              <li key={city.name}>
                <Link
                  to={city.href}
                  className="group inline-flex items-center gap-2 rounded-lg text-xs font-bold text-slate-600 transition duration-300 hover:translate-x-1 hover:text-orange-600"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-200 transition duration-300 group-hover:bg-orange-600" />
                  {city.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SocialIcon({ icon, label, href, external = false, disabled = false }) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        aria-label={`${label} coming soon`}
        title={`${label} account coming soon`}
        className="relative flex h-12 w-12 cursor-not-allowed items-center justify-center rounded-2xl bg-slate-100 text-slate-400 shadow-sm ring-1 ring-slate-200"
      >
        {icon}
        <span className="absolute -right-1 -top-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[8px] font-black uppercase text-orange-700 ring-1 ring-orange-200">
          Soon
        </span>
      </button>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={label}
      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-orange-600 hover:text-white hover:shadow-xl hover:shadow-orange-600/20 focus:outline-none focus:ring-4 focus:ring-orange-100"
    >
      {icon}
    </a>
  );
}

function ContactCard({ icon, label, value, sub, href, color, internal = false }) {
  const colorMap = {
    orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-600",
    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-600",
    green: "bg-green-50 text-green-600 group-hover:bg-green-600",
  };

  const content = (
    <div className="group rounded-[2rem] border border-orange-100 bg-white/82 p-6 shadow-[0_18px_55px_rgba(251,146,60,0.11)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(251,146,60,0.18)]">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl p-4 transition group-hover:text-white ${
            colorMap[color] || colorMap.orange
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">
            {label}
          </p>

          <p className="mt-2 break-words font-black text-[#2d145f]">{value}</p>

          <p className="mt-1 text-sm font-semibold text-slate-500">{sub}</p>
        </div>
      </div>
    </div>
  );

  if (!href) return content;

  if (internal) {
    return (
      <Link
        to={href}
        className="block rounded-[2rem] outline-none focus:ring-4 focus:ring-orange-100"
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className="block rounded-[2rem] outline-none focus:ring-4 focus:ring-orange-100"
    >
      {content}
    </a>
  );
}

export default Footer;
