import { useEffect, useMemo, useState } from "react";
import { FaBars, FaTimes, FaChevronDown } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import logo from "../assets/logo.png";

const italyLinks = [
  { name: "Italy Guide", path: "/countries/italy", badge: "Live" },
  { name: "Italian Universities", path: "/universities", badge: "Finder" },
  { name: "Scholarships", path: "/scholarships", badge: "DSU" },
  { name: "Milan City Guide", path: "/countries/italy/milan", badge: "City" },
  { name: "Rome City Guide", path: "/countries/italy/rome", badge: "City" },
  { name: "Bologna City Guide", path: "/countries/italy/bologna", badge: "City" },
  { name: "Padua City Guide", path: "/countries/italy/padua", badge: "City" },
  {
    name: "Book Italy Consultation",
    path: "/appointment?country=Italy&service=Free Italy Study Plan",
    badge: "Free",
  },
];

const serviceLinks = [
  {
    name: "All Services",
    path: "/services",
    live: true,
    badge: "Hub",
  },
  {
    name: "University Selection",
    path: "/appointment?country=Italy&service=Italy University Selection",
    live: true,
    badge: "Live",
  },
  {
    name: "Scholarship Guidance",
    path: "/scholarships",
    live: true,
    badge: "DSU",
  },
  {
    name: "Admission Guidance",
    path: "/appointment?country=Italy&service=Italy Admission Guidance",
    live: true,
    badge: "Call",
  },
  {
    name: "SOP & Documentation",
    path: "/appointment?country=Italy&service=SOP%20%26%20Documentation",
    live: true,
    badge: "Call",
  },
  {
    name: "Visa Guidance",
    path: "/appointment?country=Italy&service=Italy Visa Guidance",
    live: true,
    badge: "Call",
  },
  {
    name: "Book Free Consultation",
    path: "/appointment?country=Italy&service=Free Italy Study Plan",
    live: true,
    badge: "Free",
  },
];

const navLinks = [
  { name: "Home", path: "/", type: "route" },
  { name: "Countries", path: "/countries", type: "route" },
  { name: "Study in Italy", type: "italyDropdown" },
  { name: "Universities", path: "/universities", type: "route" },
  
  { name: "Services", type: "servicesDropdown" },
  { name: "Contact", path: "/contact", type: "route" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [italyOpen, setItalyOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileItalyOpen, setMobileItalyOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const routeGroup = useMemo(() => {
    const path = location.pathname;

    return {
      isItaly:
        path.startsWith("/countries/italy") ||
        path.startsWith("/universities") ||
        path.startsWith("/scholarships"),
      isServices:
        path.startsWith("/scholarships") ||
        path.startsWith("/universities") ||
        path.startsWith("/appointment"),
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setServicesOpen(false);
    setItalyOpen(false);
    setMobileServicesOpen(false);
    setMobileItalyOpen(false);
  }, [location.pathname]);

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

  const goToRoute = (path) => {
    setMenuOpen(false);
    setServicesOpen(false);
    setItalyOpen(false);
    setMobileServicesOpen(false);
    setMobileItalyOpen(false);

    navigate(path);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 120);
  };

  const goHome = () => {
    goToRoute("/");
  };

  const handleServiceClick = (service) => {
    if (!service.live) return;
    goToRoute(service.path);
  };

  const isLinkActive = (link) => {
    if (link.type === "italyDropdown") return routeGroup.isItaly;
    if (link.type === "servicesDropdown") return routeGroup.isServices;
    if (link.path === "/") return location.pathname === "/";
    return location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
  };

  return (
    <nav
      className={`fixed left-0 top-0 z-[9999] w-full transition-all duration-500 ${
        scrolled
          ? "bg-[#fff8ec]/94 shadow-[0_10px_34px_rgba(120,70,20,0.08)] backdrop-blur-xl"
          : "bg-gradient-to-b from-[#fff8ec]/92 via-[#fff8ec]/72 to-[#fff8ec]/20 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-[86px] max-w-[1500px] items-center justify-between gap-5 px-4 md:px-6 lg:px-8">
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
            const isActive = isLinkActive(link);

            if (link.type === "italyDropdown") {
              return (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => setItalyOpen(true)}
                  onMouseLeave={() => setItalyOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => goToRoute("/countries/italy")}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-3 transition duration-300 focus:outline-none focus:ring-4 focus:ring-orange-100 ${
                      isActive
                        ? "bg-orange-500 text-white shadow-[0_10px_24px_rgba(234,88,12,0.22)]"
                        : "text-[#7a4a20] hover:bg-orange-100 hover:text-orange-600"
                    }`}
                  >
                    {link.name}
                    <FaChevronDown
                      className={`text-[10px] transition ${italyOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {italyOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-1/2 top-[calc(100%+12px)] w-[390px] -translate-x-1/2 rounded-[28px] bg-white/96 p-3 shadow-[0_24px_70px_rgba(120,70,20,0.16)] ring-1 ring-orange-100 backdrop-blur-xl"
                      >
                        <div className="mb-2 rounded-[22px] bg-[#fff8ec] px-4 py-3 ring-1 ring-orange-100">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">
                            Italy Ecosystem
                          </p>
                          <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                            Country guide, live city pages, university finder, DSU scholarship hub and consultation route.
                          </p>
                        </div>

                        <div className="grid gap-1">
                          {italyLinks.map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => goToRoute(item.path)}
                              className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-[#2d145f] transition hover:bg-orange-50 hover:text-orange-600"
                            >
                              <span>{item.name}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                  item.badge === "Free"
                                    ? "bg-green-100 text-green-700"
                                    : item.badge === "DSU"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {item.badge}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            if (link.type === "servicesDropdown") {
              return (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => goToRoute("/services")}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-3 transition duration-300 focus:outline-none focus:ring-4 focus:ring-orange-100 ${
                      isActive
                        ? "bg-orange-500 text-white shadow-[0_10px_24px_rgba(234,88,12,0.22)]"
                        : "text-[#7a4a20] hover:bg-orange-100 hover:text-orange-600"
                    }`}
                  >
                    {link.name}
                    <FaChevronDown
                      className={`text-[10px] transition ${servicesOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {servicesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-1/2 top-[calc(100%+12px)] w-[370px] -translate-x-1/2 rounded-[28px] bg-white/96 p-3 shadow-[0_24px_70px_rgba(120,70,20,0.16)] ring-1 ring-orange-100 backdrop-blur-xl"
                      >
                        <div className="mb-2 rounded-[22px] bg-[#fff8ec] px-4 py-3 ring-1 ring-orange-100">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">
                            Services
                          </p>
                          <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                            Live guidance routes connected to Italy planning. No fake services, no dead promises.
                          </p>
                        </div>

                        <div className="grid gap-1">
                          {serviceLinks.map((service) => (
                            <button
                              key={service.name}
                              type="button"
                              disabled={!service.live}
                              onClick={() => handleServiceClick(service)}
                              className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                                service.live
                                  ? "text-[#2d145f] hover:bg-orange-50 hover:text-orange-600"
                                  : "cursor-not-allowed text-slate-400"
                              }`}
                            >
                              <span>{service.name}</span>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                  service.badge === "Live"
                                    ? "bg-green-100 text-green-700"
                                    : service.badge === "Call"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {service.badge}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <button
                key={link.name}
                type="button"
                onClick={() => goToRoute(link.path)}
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
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="rounded-full bg-white/72 px-5 py-3 text-sm font-bold text-[#2b1607] shadow-sm ring-1 ring-orange-100/80 transition hover:text-orange-600 hover:ring-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
          >
            Student Login
          </Link>

          <button
            type="button"
            onClick={() => goToRoute("/appointment?country=Italy&service=Free Italy Study Plan")}
            className="rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_26px_rgba(234,88,12,0.26)] transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200"
          >
            Book Free Consultation
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
                <div className="rounded-[1.5rem] bg-orange-50 px-4 py-3 ring-1 ring-orange-100">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                    Italy live now
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 text-[#7a4a20]">
                    Explore Italy, cities, universities, scholarships and consultation from one connected menu.
                  </p>
                </div>

                {navLinks.map((link, index) => {
                  const isActive = isLinkActive(link);

                  if (link.type === "italyDropdown") {
                    return (
                      <motion.div
                        key={link.name}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, delay: index * 0.035 }}
                        className="rounded-2xl bg-white/55 ring-1 ring-orange-100"
                      >
                        <button
                          type="button"
                          onClick={() => setMobileItalyOpen((prev) => !prev)}
                          aria-expanded={mobileItalyOpen}
                          className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-base font-semibold transition focus:outline-none focus:ring-4 focus:ring-orange-100 ${
                            isActive
                              ? "bg-orange-500 text-white shadow-[0_10px_24px_rgba(234,88,12,0.22)]"
                              : "text-[#7a4a20] hover:bg-orange-100 hover:text-orange-600"
                          }`}
                        >
                          <span>{link.name}</span>
                          <FaChevronDown
                            className={`text-xs transition ${mobileItalyOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        <AnimatePresence>
                          {mobileItalyOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2 px-3 pb-3 pt-2">
                                {italyLinks.map((item) => (
                                  <button
                                    key={item.name}
                                    type="button"
                                    onClick={() => goToRoute(item.path)}
                                    className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-left text-sm font-black text-[#2d145f]"
                                  >
                                    <span>{item.name}</span>
                                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase text-orange-700">
                                      {item.badge}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }

                  if (link.type === "servicesDropdown") {
                    return (
                      <motion.div
                        key={link.name}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, delay: index * 0.035 }}
                        className="rounded-2xl bg-white/55 ring-1 ring-orange-100"
                      >
                        <button
                          type="button"
                          onClick={() => setMobileServicesOpen((prev) => !prev)}
                          aria-expanded={mobileServicesOpen}
                          className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-base font-semibold transition focus:outline-none focus:ring-4 focus:ring-orange-100 ${
                            isActive
                              ? "bg-orange-500 text-white shadow-[0_10px_24px_rgba(234,88,12,0.22)]"
                              : "text-[#7a4a20] hover:bg-orange-100 hover:text-orange-600"
                          }`}
                        >
                          <span>{link.name}</span>
                          <FaChevronDown
                            className={`text-xs transition ${mobileServicesOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        <AnimatePresence>
                          {mobileServicesOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2 px-3 pb-3 pt-2">
                                {serviceLinks.map((service) => (
                                  <button
                                    key={service.name}
                                    type="button"
                                    disabled={!service.live}
                                    onClick={() => handleServiceClick(service)}
                                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black ${
                                      service.live
                                        ? "bg-white text-[#2d145f]"
                                        : "cursor-not-allowed bg-orange-50/70 text-slate-400"
                                    }`}
                                  >
                                    <span>{service.name}</span>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                        service.badge === "Live"
                                          ? "bg-green-100 text-green-700"
                                          : service.badge === "Call"
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-orange-100 text-orange-700"
                                      }`}
                                    >
                                      {service.badge}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.035 }}
                    >
                      <button
                        type="button"
                        onClick={() => goToRoute(link.path)}
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
                  onClick={() => goToRoute("/appointment?country=Italy&service=Free Italy Study Plan")}
                  className="block w-full rounded-2xl bg-orange-500 py-4 text-center font-semibold text-white shadow-[0_12px_26px_rgba(234,88,12,0.24)] transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200"
                >
                  Book Free Consultation
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