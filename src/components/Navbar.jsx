import { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import logo from "../assets/logo.jpeg";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goHome = () => {
    setMenuOpen(false);
    navigate("/");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Countries", path: "/countries" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav
      className={`fixed left-0 top-0 z-[9999] w-full transition-all duration-500 ${
        scrolled
          ? "border-b border-white/10 bg-[#050505]/90 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
          : "bg-gradient-to-b from-black/60 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        {/* LOGO */}
        <button
          type="button"
          onClick={goHome}
          className="group relative z-[10000] flex shrink-0 cursor-pointer items-center gap-3 text-left"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#D4AF37]/40 bg-black shadow-[0_0_25px_rgba(212,175,55,0.16)]">
            <img
              src={logo}
              alt="Zaifan Consultancy"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="leading-tight">
            <h1 className="text-lg font-extrabold tracking-tight text-white">
              Zaifan
            </h1>

            <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
              Consultancy
            </p>
          </div>
        </button>

        {/* DESKTOP LINKS */}
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-2 text-sm font-medium backdrop-blur-xl md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className={({ isActive }) =>
                `rounded-full px-5 py-3 transition duration-300 ${
                  isActive
                    ? "bg-[#D4AF37] text-black shadow-[0_0_22px_rgba(212,175,55,0.22)]"
                    : "text-gray-400 hover:bg-white/[0.06] hover:text-[#D4AF37]"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* DESKTOP CTA */}
        <Link
          to="/contact"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="hidden shrink-0 rounded-full bg-[#D4AF37] px-7 py-4 font-semibold text-black shadow-[0_0_25px_rgba(212,175,55,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#E7C768] md:inline-flex"
        >
          Free Consultation
        </Link>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="relative z-[10000] flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xl text-white backdrop-blur-xl transition hover:border-[#D4AF37] hover:text-[#D4AF37] md:hidden"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.28 }}
            className="border-t border-white/10 bg-[#050505]/95 px-4 pb-5 pt-3 backdrop-blur-2xl md:hidden"
          >
            <div className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <NavLink
                    to={link.path}
                    onClick={() => {
                      setMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-4 text-base font-medium transition ${
                        isActive
                          ? "bg-[#D4AF37] text-black"
                          : "text-gray-300 hover:bg-white/[0.05] hover:text-[#D4AF37]"
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                </motion.div>
              ))}

              <Link
                to="/contact"
                onClick={() => {
                  setMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="block rounded-2xl bg-[#D4AF37] py-4 text-center font-semibold text-black shadow-[0_0_25px_rgba(212,175,55,0.18)] transition hover:bg-[#E7C768]"
              >
                Free Consultation
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;