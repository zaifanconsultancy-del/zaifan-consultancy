import { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/logo.jpeg";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Countries", path: "/countries" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav
      className={`fixed left-0 top-0 z-[9999] w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#050505]/90 backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        
        {/* LOGO */}
        <Link
          to="/"
          className="flex items-center gap-3 transition hover:opacity-90"
        >
          <img
            src={logo}
            alt="Zaifan Consultancy"
            className="h-10 w-10 rounded-full border border-[#D4AF37]/30 object-cover shadow-[0_0_25px_rgba(212,175,55,0.12)] md:h-12 md:w-12"
          />

          <div className="leading-tight">
            <h1 className="text-base font-extrabold text-white md:text-lg">
              Zaifan
            </h1>

            <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] md:text-[11px]">
              Consultancy
            </p>
          </div>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden items-center gap-9 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `transition ${
                  isActive
                    ? "text-[#D4AF37]"
                    : "text-gray-400 hover:text-[#D4AF37]"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* DESKTOP BUTTON */}
        <Link
          to="/contact"
          className="hidden rounded-full bg-[#D4AF37] px-6 py-3 font-semibold text-black shadow-[0_0_25px_rgba(212,175,55,0.16)] transition hover:scale-105 hover:bg-[#E7C768] md:inline-flex"
        >
          Free Consultation
        </Link>

        {/* MOBILE BUTTON */}
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37] md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#050505]/95 px-4 py-5 backdrop-blur-2xl md:hidden">
          <div className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-4 text-base font-medium transition ${
                    isActive
                      ? "bg-[#D4AF37] text-black"
                      : "text-gray-300 hover:bg-white/[0.04] hover:text-[#D4AF37]"
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="block rounded-2xl bg-[#D4AF37] py-4 text-center font-semibold text-black transition hover:bg-[#E7C768]"
            >
              Free Consultation
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;