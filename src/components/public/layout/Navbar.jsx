import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  ChevronDown,
  FileCheck2,
  GraduationCap,
  LayoutGrid,
  Menu,
  MessageCircle,
  PenLine,
  Stamp,
  UserRound,
  X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import logo from "../../../assets/images/brand/logo-tight.webp";
import logoLight from "../../../assets/images/brand/logo-light.webp";
import { countryIndex as countryList } from "../../../data/countries/countryIndex";
import { FlagMark } from "../destinations/DestinationUI";

const WHATSAPP_LINK = `https://wa.me/923305718131?text=${encodeURIComponent(
  "Hello Zaifan Consultancy, I want to book a free study abroad consultation."
)}`;

const euFlag = { slug: "european-union", code: "EU", name: "European Union" };

// Planning tools that work across every destination, not just one country.
const planningLinks = [
  { name: "Compare all countries", path: "/countries" },
  { name: "Budget matcher", path: "/countries#budget" },
  { name: "University finder", path: "/universities" },
  { name: "Scholarships", path: "/scholarships" },
];

// One well-known student city per destination.
const popularCityLinks = [
  { name: "Milan", path: "/countries/italy/milan" },
  { name: "Munich", path: "/countries/germany/munich" },
  { name: "Paris", path: "/countries/france/paris" },
  { name: "Leuven", path: "/countries/belgium/leuven" },
  { name: "Bucharest", path: "/countries/romania/bucharest" },
  { name: "Vilnius", path: "/countries/lithuania/vilnius" },
  { name: "Istanbul", path: "/countries/turkey/istanbul" },
  { name: "Shanghai", path: "/countries/china/shanghai" },
  { name: "Hanoi", path: "/countries/vietnam/hanoi" },
];

const serviceLinks = [
  { name: "University Selection", text: "A shortlist that fits you", path: "/services/university-selection", icon: GraduationCap },
  { name: "Scholarship Guidance", text: "Funding you can actually win", path: "/services/scholarship-guidance", icon: Award },
  { name: "Admission Guidance", text: "Applications done right, on time", path: "/services/admission-guidance", icon: FileCheck2 },
  { name: "SOP & Documentation", text: "SOPs, CVs and attestation", path: "/services/sop-documentation", icon: PenLine },
  { name: "Visa Guidance", text: "Visa file and interview prep", path: "/services/visa-guidance", icon: Stamp },
  { name: "Free Consultation", text: "Talk to an advisor, free", path: "/services/free-consultation", icon: MessageCircle },
];

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Countries", path: "/countries" },
  { name: "Universities", path: "/universities" },
  { name: "Destinations", menu: "destinations" },
  { name: "Services", menu: "services" },
  { name: "Contact", path: "/contact" },
];

// Hover menus open after a short pause and close after a short grace period,
// so they don't flash open over the page when the mouse merely passes by.
function useHoverMenu() {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const schedule = (value, delay) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(value), delay);
  };

  const close = useCallback(() => {
    window.clearTimeout(timer.current);
    setOpen(false);
  }, []);

  // Clicking (or tapping) the label opens the menu; it never toggles shut, since
  // the mouse may already have opened it on the way in.
  const show = useCallback(() => {
    window.clearTimeout(timer.current);
    setOpen(true);
  }, []);

  return {
    open,
    close,
    show,
    hoverProps: {
      onMouseEnter: () => schedule(true, 120),
      onMouseLeave: () => schedule(false, 200),
    },
  };
}

const panelMotion = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
};

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const destinationsMenu = useHoverMenu();
  const servicesMenu = useHoverMenu();
  const { close: closeDestinations } = destinationsMenu;
  const { close: closeServices } = servicesMenu;
  const closeMenus = useCallback(() => {
    closeDestinations();
    closeServices();
  }, [closeDestinations, closeServices]);

  const navigate = useNavigate();
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  const activeName = useMemo(() => {
    const path = location.pathname;
    if (path === "/") return "Home";
    if (path === "/countries") return "Countries";
    if (path.startsWith("/universities") || path.includes("/universities/")) return "Universities";
    if (path.startsWith("/countries/") || path.startsWith("/scholarships")) return "Destinations";
    if (path.startsWith("/services")) return "Services";
    if (path.startsWith("/contact")) return "Contact";
    return null;
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
      // Scrolling means the reader is looking at the page, not the menu.
      closeMenus();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [closeMenus]);

  useEffect(() => {
    closeMenus();
    setMenuOpen(false);
    setMobileSection(null);
  }, [location.pathname, closeMenus]);

  // Menus opened by a click (keyboard or touch) close with Escape.
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && closeMenus();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMenus]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const goToRoute = (path) => {
    setMenuOpen(false);
    closeMenus();
    navigate(path);
    const [, hash] = path.split("#");
    // Links with a #section land on that section; everything else starts at the top.
    window.setTimeout(
      () => {
        const target = hash && document.getElementById(hash);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
      },
      hash ? 500 : 120
    );
  };

  // Plain clicks go through goToRoute; modified clicks (new tab) keep the browser default.
  const linkClick = (path) => (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    goToRoute(path);
  };

  const menus = { destinations: destinationsMenu, services: servicesMenu };
  const pillTarget = hovered || activeName;

  return (
    <>
      {/* Reading progress */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[10001] h-[3px] origin-left bg-gradient-to-r from-[#ffb36d] via-[#ff7b1c] to-[#ff4b12]"
      />

      <header className="fixed inset-x-0 top-0 z-[10000]">
        {/* Slim info strip, only at the very top of the page */}
        <div
          className={`hidden overflow-hidden bg-[#071f50] text-white transition-[height] duration-300 sm:block ${scrolled ? "h-0" : "h-9"}`}
        >
          <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-center gap-4 px-4 text-[12px] font-bold">
            <span className="text-white/80">
              <span className="text-[#ff7b1c]">✦</span> Free first consultation for every student
            </span>
            <span className="text-white/25">|</span>
            <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#ffb36d] transition hover:text-white">
              <FaWhatsapp size={14} /> +92 330 5718131
            </a>
            <span className="hidden text-white/25 md:inline">|</span>
            <Link
              to="/appointment?service=Free%20Consultation"
              onClick={linkClick("/appointment?service=Free%20Consultation")}
              className="hidden items-center gap-1 text-white transition hover:text-[#ffb36d] md:inline-flex"
            >
              Book now <ArrowRight size={13} strokeWidth={3} />
            </Link>
          </div>
        </div>

        <div className={`px-3 transition-[padding] duration-500 sm:px-4 ${scrolled ? "pt-2" : "pt-3"}`}>
          {/* Light and wide at the top; morphs into a compact navy pill once you scroll */}
          <nav
            className={`relative mx-auto flex items-center justify-between gap-3 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              scrolled
                ? "h-[58px] max-w-[1140px] bg-[#071f50]/95 pl-5 pr-2 shadow-[0_22px_55px_rgba(7,31,80,0.35)] ring-1 ring-white/10 backdrop-blur-xl"
                : "h-[64px] max-w-[1400px] bg-white/75 pl-5 pr-2 shadow-[0_10px_30px_rgba(7,31,80,0.07)] ring-1 ring-white backdrop-blur-md"
            }`}
            aria-label="Main"
          >
            <Link to="/" onClick={linkClick("/")} className="relative block h-9 w-[106px] shrink-0" aria-label="Zaifan Consultancy home">
              <img
                src={logo}
                alt="Zaifan Consultancy"
                width="340"
                height="115"
                className={`absolute inset-0 h-full w-full object-contain object-left transition-opacity duration-500 ${scrolled ? "opacity-0" : "opacity-100"}`}
              />
              <img
                src={logoLight}
                alt=""
                aria-hidden="true"
                width="340"
                height="115"
                className={`absolute inset-0 h-full w-full object-contain object-left transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}
              />
            </Link>

            {/* Desktop links with a highlight that slides between them */}
            <ul className="hidden items-center lg:flex" onMouseLeave={() => setHovered(null)}>
              {navLinks.map((link) => {
                const menu = link.menu && menus[link.menu];
                const isActive = activeName === link.name;
                const solid = isActive && !hovered;
                const pillColor = solid ? (scrolled ? "bg-[#ff4b12]" : "bg-[#071f50]") : scrolled ? "bg-white/10" : "bg-[#fff1ea]";
                const textColor = solid ? "text-white" : scrolled ? "text-white/85" : isActive ? "text-[#ff4b12]" : "text-[#071f50]";
                const content = (
                  <>
                    {pillTarget === link.name && (
                      <motion.span
                        layoutId="nav-pill"
                        className={`absolute inset-0 rounded-full ${pillColor}`}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className={`relative flex items-center gap-1 transition-colors ${textColor}`}>
                      {link.name}
                      {menu && <ChevronDown size={14} strokeWidth={3} className={`transition ${menu.open ? "rotate-180" : ""}`} />}
                    </span>
                  </>
                );
                const className = "relative block rounded-full px-4 py-2.5 text-sm font-black";

                return (
                  <li
                    key={link.name}
                    onMouseEnter={() => {
                      setHovered(link.name);
                      menu?.hoverProps.onMouseEnter();
                    }}
                    onMouseLeave={menu?.hoverProps.onMouseLeave}
                  >
                    {menu ? (
                      <button
                        type="button"
                        className={className}
                        aria-expanded={menu.open}
                        aria-haspopup="true"
                        // Destinations is a menu of country guides; it must not land on /countries like "Countries" does.
                        onClick={() => (link.menu === "destinations" ? menu.show() : goToRoute("/services"))}
                      >
                        {content}
                      </button>
                    ) : (
                      <Link to={link.path} onClick={linkClick(link.path)} className={className} aria-current={isActive ? "page" : undefined}>
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-1.5">
              <Link
                to="/student"
                onClick={linkClick("/student")}
                title="Student login"
                className={`hidden items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-black transition md:inline-flex ${
                  scrolled ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-[#071f50] hover:bg-[#fff1ea]"
                }`}
              >
                <UserRound size={17} strokeWidth={2.6} />
                <span className="hidden xl:inline">Student login</span>
              </Link>
              <Link
                to="/appointment?service=Free%20Consultation"
                onClick={linkClick("/appointment?service=Free%20Consultation")}
                className="group hidden items-center gap-2 rounded-full bg-[#ff4b12] py-1.5 pl-5 pr-1.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(255,75,18,0.35)] transition hover:bg-[#ff642f] sm:inline-flex"
              >
                Book free call
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#ff4b12] transition group-hover:-rotate-45">
                  <ArrowRight size={16} strokeWidth={3} />
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className={`grid h-11 w-11 place-items-center rounded-full transition lg:hidden ${
                  scrolled ? "bg-white text-[#071f50] hover:bg-[#ff4b12] hover:text-white" : "bg-[#071f50] text-white hover:bg-[#ff4b12]"
                }`}
              >
                <Menu size={20} strokeWidth={2.6} />
              </button>
            </div>
          </nav>
        </div>

        {/* Destinations mega menu */}
        <AnimatePresence>
          {destinationsMenu.open && (
            <motion.div
              {...panelMotion}
              {...destinationsMenu.hoverProps}
              className="absolute left-0 right-0 top-full mx-auto mt-2 hidden w-[880px] lg:block"
            >
              <div className="grid grid-cols-[1.45fr_1fr] gap-3 rounded-[30px] bg-white p-3 shadow-[0_30px_80px_rgba(7,31,80,0.18)] ring-1 ring-orange-100">
                <div className="p-2">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff4b12]">{countryList.length} destinations</p>
                    <button
                      type="button"
                      onClick={() => goToRoute("/countries")}
                      className="inline-flex items-center gap-1 text-xs font-black text-[#071f50] hover:text-[#ff4b12]"
                    >
                      Compare all <ArrowRight size={13} strokeWidth={3} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {countryList.map((country) => (
                      <button
                        key={country.slug}
                        type="button"
                        onClick={() => goToRoute(`/countries/${country.slug}`)}
                        className="group flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[#fff7ed]"
                      >
                        <FlagMark country={country} className="h-6 w-9 transition group-hover:scale-110" />
                        <span className="min-w-0">
                          <span className="block text-sm font-black text-[#071f50] group-hover:text-[#ff4b12]">{country.name}</span>
                          <span className="block truncate text-[10px] font-bold uppercase tracking-[0.06em] text-[#7a879c]">{country.region}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]">Popular student cities</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 px-2">
                    {popularCityLinks.map((city) => (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() => goToRoute(city.path)}
                        className="rounded-full bg-[#fff7ed] px-3 py-1.5 text-xs font-black text-[#071f50] ring-1 ring-orange-100 transition hover:bg-[#ff4b12] hover:text-white"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => goToRoute("/countries/european-union")}
                    className="group flex items-center gap-3 rounded-[22px] bg-[#003399] p-4 text-left text-white transition hover:-translate-y-0.5"
                  >
                    <FlagMark country={euFlag} className="h-8 w-12" />
                    <span className="flex-1">
                      <span className="block text-sm font-black">Study in the EU</span>
                      <span className="block text-[11px] font-bold text-white/70">Schengen, Erasmus+ and EU options compared</span>
                    </span>
                    <ArrowUpRight size={18} className="text-[#ffcc00] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </button>
                  <div className="flex-1 rounded-[22px] bg-[#071f50] p-4 text-white">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffb36d]">Plan your move</p>
                    <div className="mt-3 grid gap-1">
                      {planningLinks.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => goToRoute(item.path)}
                          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-black transition hover:bg-white/10"
                        >
                          {item.name}
                          <ArrowRight size={15} strokeWidth={3} className="text-[#ff7b1c] transition group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Services mega menu */}
        <AnimatePresence>
          {servicesMenu.open && (
            <motion.div
              {...panelMotion}
              {...servicesMenu.hoverProps}
              className="absolute left-0 right-0 top-full mx-auto mt-2 hidden w-[620px] lg:block"
            >
              <div className="rounded-[30px] bg-white p-3 shadow-[0_30px_80px_rgba(7,31,80,0.18)] ring-1 ring-orange-100">
                <div className="grid grid-cols-2 gap-1.5">
                  {serviceLinks.map((service) => (
                    <button
                      key={service.name}
                      type="button"
                      onClick={() => goToRoute(service.path)}
                      className="group flex items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-[#fff7ed]"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] transition group-hover:bg-[#ff4b12] group-hover:text-white">
                        <service.icon size={20} strokeWidth={2.4} />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-[#071f50]">{service.name}</span>
                        <span className="block text-xs font-semibold text-[#7a879c]">{service.text}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goToRoute("/services")}
                  className="mt-2 flex w-full items-center justify-between rounded-2xl bg-[#071f50] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0b2a6b]"
                >
                  <span className="flex items-center gap-2">
                    <LayoutGrid size={16} /> See all services
                  </span>
                  <ArrowRight size={16} strokeWidth={3} className="text-[#ff7b1c]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile: full-screen menu that opens as a circle from the menu button */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 40px) 40px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[10002] flex flex-col overflow-y-auto bg-[#071f50] px-5 pb-8 pt-5 text-white lg:hidden"
          >
            <div className="flex items-center justify-between">
              <img src={logoLight} alt="Zaifan Consultancy" width="340" height="115" className="h-9 w-auto" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-[#ff4b12]"
              >
                <X size={20} strokeWidth={2.6} />
              </button>
            </div>

            <ul className="mt-8 space-y-1">
              {navLinks.map((link, index) => {
                const open = mobileSection === link.menu;
                return (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + index * 0.05, duration: 0.35 }}
                    className="border-b border-white/10"
                  >
                    {link.menu ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setMobileSection(open ? null : link.menu)}
                          aria-expanded={open}
                          className="flex w-full items-center justify-between py-4 text-left text-3xl font-black tracking-[-0.04em]"
                        >
                          <span className={activeName === link.name ? "text-[#ff7b1c]" : ""}>{link.name}</span>
                          <ChevronDown size={24} className={`transition ${open ? "rotate-180 text-[#ff7b1c]" : "text-white/50"}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28 }}
                              className="overflow-hidden"
                            >
                              {link.menu === "destinations" ? (
                                <div className="grid grid-cols-2 gap-2 pb-4">
                                  {countryList.map((country) => (
                                    <button
                                      key={country.slug}
                                      type="button"
                                      onClick={() => goToRoute(`/countries/${country.slug}`)}
                                      className="flex items-center gap-2.5 rounded-2xl bg-white/[0.07] px-3 py-3 text-left text-sm font-black"
                                    >
                                      <FlagMark country={country} className="h-5 w-[30px] rounded-[4px] shadow-none" />
                                      {country.name}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => goToRoute("/countries/european-union")}
                                    className="flex items-center gap-2.5 rounded-2xl bg-[#003399] px-3 py-3 text-left text-sm font-black"
                                  >
                                    <FlagMark country={euFlag} className="h-5 w-[30px] rounded-[4px] shadow-none" />
                                    Study in the EU
                                  </button>
                                </div>
                              ) : (
                                <div className="grid gap-1.5 pb-4">
                                  {serviceLinks.map((service) => (
                                    <button
                                      key={service.name}
                                      type="button"
                                      onClick={() => goToRoute(service.path)}
                                      className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-3 py-3 text-left"
                                    >
                                      <service.icon size={18} className="shrink-0 text-[#ff7b1c]" />
                                      <span>
                                        <span className="block text-sm font-black">{service.name}</span>
                                        <span className="block text-xs font-semibold text-white/55">{service.text}</span>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => goToRoute(link.path)}
                        className="flex w-full items-center justify-between py-4 text-left text-3xl font-black tracking-[-0.04em]"
                      >
                        <span className={activeName === link.name ? "text-[#ff7b1c]" : ""}>{link.name}</span>
                        <ArrowUpRight size={22} className="text-white/40" />
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.35 }}
              className="mt-auto grid gap-2.5 pt-8"
            >
              <button
                type="button"
                onClick={() => goToRoute("/appointment?service=Free%20Consultation")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-6 py-4 text-base font-black"
              >
                Book a free consultation <ArrowRight size={18} strokeWidth={3} />
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-4 py-3.5 text-sm font-black"
                >
                  <FaWhatsapp size={17} /> WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => goToRoute("/student")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-3.5 text-sm font-black"
                >
                  <UserRound size={16} /> Student login
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
