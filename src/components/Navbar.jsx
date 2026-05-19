import { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import logo from "../assets/logo.jpeg";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const navLinks = [
    { name: "Home", href: "#home", id: "home" },
    { name: "Services", href: "#services", id: "services" },
    { name: "About", href: "#about", id: "about" },
    { name: "Countries", href: "#countries", id: "countries" },
    { name: "Contact", href: "#contact", id: "contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map((link) => document.getElementById(link.id));

      sections.forEach((section) => {
        if (!section) return;

        const rect = section.getBoundingClientRect();

        if (rect.top <= 160 && rect.bottom >= 160) {
          setActiveSection(section.id);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="fixed left-0 top-0 z-[9999] w-full border-b border-white/10 bg-[#0b0b0b]/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#home" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Zaifan Consultancy"
            className="h-12 w-12 rounded-full border border-[#D4AF37]/30 object-cover shadow-[0_0_25px_rgba(212,175,55,0.12)]"
          />

          <div className="hidden leading-tight sm:block">
            <h1 className="text-lg font-extrabold text-white">Zaifan</h1>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF37]">
              Consultancy
            </p>
          </div>
        </a>

        <div className="hidden items-center gap-9 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`transition ${
                activeSection === link.id
                  ? "text-[#D4AF37]"
                  : "text-gray-400 hover:text-[#D4AF37]"
              }`}
            >
              {link.name}
            </a>
          ))}
        </div>

        <a
          href="#contact"
          className="hidden rounded-full bg-[#D4AF37] px-6 py-3 font-semibold text-black shadow-[0_0_25px_rgba(212,175,55,0.16)] transition hover:scale-105 hover:bg-[#E7C768] md:inline-flex"
        >
          Free Consultation
        </a>

        <button
          className="text-2xl text-white md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#0b0b0b]/95 px-6 py-6 backdrop-blur-xl md:hidden">
          <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block text-lg transition ${
                  activeSection === link.id
                    ? "text-[#D4AF37]"
                    : "text-gray-300 hover:text-[#D4AF37]"
                }`}
              >
                {link.name}
              </a>
            ))}

            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="block rounded-full bg-[#D4AF37] py-4 text-center font-semibold text-black"
            >
              Free Consultation
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;