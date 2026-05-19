import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaLinkedinIn,
} from "react-icons/fa";

function Footer() {
  const quickLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "About", href: "#about" },
    { name: "Countries", href: "#countries" },
    { name: "Contact", href: "#contact" },
  ];

  const countries = [
    "Italy",
    "Germany",
    "Turkey",
    "United Kingdom",
    "Canada",
    "Australia",
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#0F0F10] px-6 pt-24 pb-8 text-white">
      <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-amber-200/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] text-xl font-extrabold text-black">
                Z
              </div>

              <div>
                <h2 className="text-2xl font-extrabold">
                  Zaifan Consultancy
                </h2>

                <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                  Study Abroad Guidance
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-xl leading-relaxed text-gray-400">
              Professional guidance for students planning admissions,
              scholarships, documentation and visa preparation for international
              education.
            </p>

            <div className="mt-8 flex gap-4">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-[#D4AF37] hover:text-black"
              >
                <FaFacebookF />
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-[#D4AF37] hover:text-black"
              >
                <FaInstagram />
              </a>

              <a
                href="https://wa.me/923305718131"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-[#D4AF37] hover:text-black"
              >
                <FaWhatsapp />
              </a>

              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-[#D4AF37] hover:text-black"
              >
                <FaLinkedinIn />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-200/70">
              Links
            </h3>

            <ul className="mt-6 space-y-4 text-gray-400">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="transition hover:text-[#D4AF37]">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-200/70">
              Destinations
            </h3>

            <ul className="mt-6 space-y-4 text-gray-400">
              {countries.map((country) => (
                <li key={country}>{country}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:grid-cols-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
              Phone
            </p>

            <h4 className="mt-2 font-semibold">+92 330 5718131</h4>
            <h4 className="mt-1 font-semibold">+92 333 9396336</h4>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
              Email
            </p>

            <h4 className="mt-2 font-semibold">
              zaifanconsultancy@gmail.com
            </h4>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
              Location
            </p>

            <h4 className="mt-2 font-semibold">Pakistan</h4>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-gray-500 md:flex-row">
          <p>© 2026 Zaifan Consultancy. All rights reserved.</p>
          <p>Built for global education guidance.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;