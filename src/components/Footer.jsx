import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaLinkedinIn,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

function Footer() {
  const quickLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "About", href: "#about" },
    { name: "Countries", href: "#countries" },
    { name: "Contact", href: "#contact" },
  ];

  const services = [
    "University Admissions",
    "Scholarship Assistance",
    "Visa Guidance",
    "SOP & Documentation",
    "Application Support",
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#050505] px-6 pt-24 pb-8 text-white">
      {/* BACKGROUND BLOBS */}
      <div className="absolute right-[-12%] top-[-20%] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
      <div className="absolute bottom-[-25%] left-[-12%] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        {/* MAIN FOOTER CARD */}
        <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl md:p-10">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-100"></div>

          <div className="grid gap-12 lg:grid-cols-4">
            {/* BRAND */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-2xl font-extrabold text-[#E7C768] shadow-[0_0_35px_rgba(212,175,55,0.18)]">
                  Z
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold">
                    Zaifan Consultancy
                  </h2>

                  <p className="mt-1 text-xs uppercase tracking-[0.28em] text-[#D4AF37]">
                    Study Abroad Guidance
                  </p>
                </div>
              </div>

              <p className="mt-7 max-w-xl leading-relaxed text-gray-400">
                Professional overseas education guidance for students planning
                admissions, scholarships, documentation, and visa preparation
                with clarity and confidence.
              </p>

              {/* CTA BUTTONS */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-7 py-3 font-semibold text-black transition duration-300 hover:-translate-y-1 hover:bg-[#E7C768]"
                >
                  Book Consultation
                </a>

                <a
                  href="https://wa.me/923305718131"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white/[0.04] px-7 py-3 font-semibold text-[#E7C768] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10"
                >
                  <FaWhatsapp />
                  WhatsApp Us
                </a>
              </div>

              {/* SOCIALS */}
              <div className="mt-8 flex gap-4">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-gray-300 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black"
                >
                  <FaFacebookF />
                </a>

                <a
                  href="#"
                  aria-label="Instagram"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-gray-300 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black"
                >
                  <FaInstagram />
                </a>

                <a
                  href="https://wa.me/923305718131"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-gray-300 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black"
                >
                  <FaWhatsapp />
                </a>

                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-gray-300 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black"
                >
                  <FaLinkedinIn />
                </a>
              </div>
            </div>

            {/* QUICK LINKS */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                Quick Links
              </h3>

              <ul className="mt-7 space-y-4 text-gray-400">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="transition duration-300 hover:pl-2 hover:text-[#D4AF37]"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* SERVICES */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                Services
              </h3>

              <ul className="mt-7 space-y-4 text-gray-400">
                {services.map((service) => (
                  <li
                    key={service}
                    className="transition duration-300 hover:pl-2 hover:text-[#D4AF37]"
                  >
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CONTACT STRIP */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100"></div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                <FaPhoneAlt />
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-gray-500">
                  Phone
                </p>

                <a
                  href="tel:+923305718131"
                  className="mt-3 block font-semibold text-gray-200 transition hover:text-[#D4AF37]"
                >
                  +92 330 5718131
                </a>

                <a
                  href="tel:+923339396336"
                  className="mt-1 block font-semibold text-gray-200 transition hover:text-[#D4AF37]"
                >
                  +92 333 9396336
                </a>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100"></div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                <FaEnvelope />
              </div>

              <div className="min-w-0">
                <p className="text-sm uppercase tracking-[0.22em] text-gray-500">
                  Email
                </p>

                <a
                  href="mailto:zaifanconsultancy@gmail.com"
                  className="mt-3 block break-words font-semibold text-gray-200 transition hover:text-[#D4AF37]"
                >
                  zaifanconsultancy@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100"></div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                <FaMapMarkerAlt />
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-gray-500">
                  Location
                </p>

                <h4 className="mt-3 font-semibold text-gray-200">
                  Pakistan
                </h4>

                <p className="mt-1 text-sm text-gray-500">
                  Online consultation available
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-center text-sm text-gray-500 md:flex-row md:text-left">
          <p>© 2026 Zaifan Consultancy. All rights reserved.</p>

          <p>
            Built for students planning their{" "}
            <span className="text-[#D4AF37]">global education journey.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;