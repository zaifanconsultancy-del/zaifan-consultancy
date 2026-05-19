import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import logo from "../assets/logo.jpeg";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Countries", path: "/countries" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="fixed left-0 top-0 z-[9999] w-full border-b border-white/10 bg-[#0b0b0b]/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Zaifan Consultancy"
            className="h-12 w-12 rounded-full border border-[#D4AF37]/30 object-cover shadow-[0_0_25px_rgba(212,175,55,0.12)]"
          />

          <div className="hidden leading-tight sm:block">
            <h1 className="text-lg font-extrabold text-white">
              Zaifan
            </h1>

            <p className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF37]">
              Consultancy
            </p>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-9 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`transition ${
                location.pathname === link.path
                  ? "text-[#D4AF37]"
                  : "text-gray-400 hover:text-[#D4AF37]"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/contact"
          className="hidden rounded-full bg-[#D4AF37] px-6 py-3 font-semibold text-black shadow-[0_0_25px_rgba(212,175,55,0.16)] transition hover:scale-105 hover:bg-[#E7C768] md:inline-flex"
        >
          Free Consultation
        </Link>

        {/* Mobile Button */}
        <button
          className="text-2xl text-white md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#0b0b0b]/95 px-6 py-6 backdrop-blur-xl md:hidden">
          <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`block text-lg transition ${
                  location.pathname === link.path
                    ? "text-[#D4AF37]"
                    : "text-gray-300 hover:text-[#D4AF37]"
                }`}
              >
                {link.name}
              </Link>
            ))}

            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="block rounded-full bg-[#D4AF37] py-4 text-center font-semibold text-black"
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