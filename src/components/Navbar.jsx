import { useEffect, useMemo, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import logo from "../assets/logo.png";

const navLinks = [
  { name: "Home", section: "home" },
  { name: "Countries", section: "countries" },
  { name: "Universities", section: "universities" },
  { name: "Services", section: "dream-support" },
  { name: "Contact", section: "contact" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const isHomeLikePage = useMemo(() => {
    return location.pathname === "/" || location.pathname === "/contact";
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isHomeLikePage) {
      setActiveSection("");
      return undefined;
    }

    const handleActiveSection = () => {
      const offset = 130;
      let currentSection = "";

      navLinks.forEach((link) => {
        const element = document.getElementById(link.section);
        if (!element) return;

        const rect = element.getBoundingClientRect();

        if (rect.top <= offset && rect.bottom > offset) {
          currentSection = link.section;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleActiveSection, { passive: true });
    window.addEventListener("resize", handleActiveSection);
    handleActiveSection();

    return () => {
      window.removeEventListener("scroll", handleActiveSection);
      window.removeEventListener("resize", handleActiveSection);
    };
  }, [isHomeLikePage]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = "";
    return undefined;
  }, [menuOpen]);

  const scrollToSection = (sectionId) => {
    setMenuOpen(false);
if (sectionId === "home") {
  goHome();
  return;
}
    const doScroll = () => {
      const target = document.getElementById(sectionId);
      if (!target) return;

      const navbarOffset = 88;
      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - navbarOffset;

      window.scrollTo({ top: targetTop, behavior: "smooth" });
      setActiveSection(sectionId);
    };

    if (location.pathname !== "/" && location.pathname !== "/contact") {
      navigate(sectionId === "contact" ? "/contact" : "/");
      setTimeout(doScroll, 240);
      return;
    }

    if (location.pathname === "/contact" && sectionId !== "contact") {
      navigate("/");
      setTimeout(doScroll, 240);
      return;
    }

    doScroll();
  };

  const goHome = () => {
    setMenuOpen(false);
    setActiveSection("");

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 160);
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed left-0 top-0 z-[9999] w-full transition-all duration-500 ${
        scrolled
          ? "bg-[#fff8ec]/94 shadow-[0_10px_34px_rgba(120,70,20,0.08)] backdrop-blur-xl"
          : "bg-gradient-to-b from-[#fff8ec]/92 via-[#fff8ec]/72 to-[#fff8ec]/20 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-[86px] max-w-7xl items-center justify-between gap-5 px-4 md:px-6">
        <button
          type="button"
          onClick={goHome}
          aria-label="Go to homepage"
          className="group relative z-[10000] flex shrink-0 cursor-pointer items-center focus:outline-none"
        >
          <img
            src={logo}
            alt="Zaifan Consultancy"
            className="w-[175px] object-contain transition-all duration-300 group-hover:scale-[1.03] sm:w-[200px] lg:w-[220px]"
          />
        </button>

        <div className="hidden items-center gap-1 rounded-full bg-white/72 px-2 py-2 text-sm font-semibold shadow-[0_10px_30px_rgba(120,70,20,0.08)] ring-1 ring-orange-100/80 backdrop-blur-xl lg:flex">
          {navLinks.map((link) => {
            const isActive = activeSection === link.section;

            return (
              <button
                key={link.name}
                type="button"
                onClick={() => scrollToSection(link.section)}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-4 py-3 transition duration-300 focus:outline-none focus:ring-4 focus:ring-orange-100 ${
                  isActive
                    ? "bg-orange-500 text-white shadow-[0_10px_24px_rgba(234,88,12,0.22)]"
                    : "text-[#7a4a20] hover:bg-orange-100 hover:text-orange-600"
                }`}
              >
                {link.name}
              </button>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Link
            to="/student"
            onClick={() => {
              setMenuOpen(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="rounded-full bg-white/72 px-5 py-3 text-sm font-bold text-[#2b1607] shadow-sm ring-1 ring-orange-100/80 transition hover:text-orange-600 hover:ring-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
          >
            Student Login
          </Link>

          <button
  type="button"
  onClick={() => {
    setMenuOpen(false);
    navigate("/appointment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }}
  className="rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_26px_rgba(234,88,12,0.26)] transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200"
>
  Free Consultation
</button>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="relative z-[10000] flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 text-xl text-orange-600 shadow-[0_10px_25px_rgba(120,70,20,0.1)] ring-1 ring-orange-100/80 backdrop-blur-xl transition hover:ring-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100 lg:hidden"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close mobile menu overlay"
              className="fixed inset-0 z-[9997] bg-[#2d145f]/18 backdrop-blur-[2px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.24 }}
              className="relative z-[9998] bg-[#fff8ec]/96 px-4 pb-5 pt-3 shadow-xl backdrop-blur-xl lg:hidden"
            >
              <div className="space-y-2 rounded-[2rem] bg-white/75 p-4 shadow-2xl ring-1 ring-orange-100/80">
                {navLinks.map((link, index) => {
                  const isActive = activeSection === link.section;

                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.035 }}
                    >
                      <button
                        type="button"
                        onClick={() => scrollToSection(link.section)}
                        aria-current={isActive ? "page" : undefined}
                        className={`block w-full rounded-2xl px-4 py-4 text-left text-base font-semibold transition focus:outline-none focus:ring-4 focus:ring-orange-100 ${
                          isActive
                            ? "bg-orange-500 text-white shadow-[0_10px_24px_rgba(234,88,12,0.22)]"
                            : "text-[#7a4a20] hover:bg-orange-100 hover:text-orange-600"
                        }`}
                      >
                        {link.name}
                      </button>
                    </motion.div>
                  );
                })}

                <Link
                  to="/student"
                  onClick={() => {
                    setMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="block rounded-2xl bg-white/75 px-4 py-4 text-center font-semibold text-[#2b1607] ring-1 ring-orange-100/80 transition hover:text-orange-600 hover:ring-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
                >
                  Student Login
                </Link>

                <button
  type="button"
  onClick={() => {
    setMenuOpen(false);
    navigate("/appointment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }}
  className="block w-full rounded-2xl bg-orange-500 py-4 text-center font-semibold text-white shadow-[0_12px_26px_rgba(234,88,12,0.24)] transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200"
>
  Free Consultation
</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
