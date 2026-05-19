import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaLinkedinIn,
} from "react-icons/fa"

function Footer() {
  const quickLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "About", href: "#about" },
    { name: "Countries", href: "#countries" },
    { name: "Contact", href: "#contact" },
  ]

  const countries = [
    "Italy",
    "Germany",
    "Turkey",
    "United Kingdom",
    "Canada",
    "Australia",
  ]

  return (
    <footer className="bg-[#0F0F10] text-white px-6 pt-24 pb-8 border-t border-white/10 relative overflow-hidden">
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-amber-200/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto">

        <div className="grid lg:grid-cols-4 gap-14">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D6CEC2] text-[#111111] flex items-center justify-center font-extrabold text-xl">
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

            <p className="mt-6 text-gray-400 max-w-xl leading-relaxed">
              Professional guidance for students planning admissions,
              scholarships, documentation and visa preparation for international
              education.
            </p>

            <div className="mt-8 flex gap-4">
              <a
                href="#"
                className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D6CEC2] hover:text-[#111111] transition"
              >
                <FaFacebookF />
              </a>

              <a
                href="#"
                className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D6CEC2] hover:text-[#111111] transition"
              >
                <FaInstagram />
              </a>

              <a
                href="https://wa.me/923305718131"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D6CEC2] hover:text-[#111111] transition"
              >
                <FaWhatsapp />
              </a>

              <a
                href="#"
                className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D6CEC2] hover:text-[#111111] transition"
              >
                <FaLinkedinIn />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm uppercase tracking-[0.25em] text-amber-200/70 font-semibold">
              Links
            </h3>

            <ul className="mt-6 space-y-4 text-gray-400">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-[#D6CEC2] transition"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Countries */}
          <div>
            <h3 className="text-sm uppercase tracking-[0.25em] text-amber-200/70 font-semibold">
              Destinations
            </h3>

            <ul className="mt-6 space-y-4 text-gray-400">
              {countries.map((country) => (
                <li key={country}>
                  {country}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Bar */}
        <div className="mt-16 bg-white/5 border border-white/10 rounded-[2rem] p-6 grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-stone-500 uppercase tracking-[0.2em]">
              Phone
            </p>
            <h4 className="mt-2 font-semibold">
              +92 330 5718131
            </h4>
          </div>

          <div>
            <p className="text-sm text-stone-500 uppercase tracking-[0.2em]">
              Email
            </p>
            <h4 className="mt-2 font-semibold">
              zaifanconsultancy@gmail.com
            </h4>
          </div>

          <div>
            <p className="text-sm text-stone-500 uppercase tracking-[0.2em]">
              Location
            </p>
            <h4 className="mt-2 font-semibold">
              Peshawar, KPK, Pakistan
            </h4>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 Zaifan Consultancy. All rights reserved.</p>
          <p>Built for global education guidance.</p>
        </div>

      </div>
    </footer>
  )
}

export default Footer