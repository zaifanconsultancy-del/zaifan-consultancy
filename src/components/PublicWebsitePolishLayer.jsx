import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { ArrowUp, CalendarCheck, MessageCircle, Sparkles } from "lucide-react";

const SECTION_IDS = [
  "home",
  "dream-support",
  "countries",
  "universities",
  "services",
  "about",
  "testimonials",
  "faq",
  "contact",
];

const SECTION_LABELS = {
  home: "Hero",
  "dream-support": "Support",
  countries: "Countries",
  universities: "Universities",
  services: "Services",
  about: "About",
  testimonials: "Stories",
  faq: "FAQ",
  contact: "Contact",
};

function getExistingSections() {
  if (typeof document === "undefined") return [];

  return SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
}

function scrollToSection(id) {
  if (typeof document === "undefined") return;

  const target = document.getElementById(id);

  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useActiveSection() {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const sections = getExistingSections();

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        root: null,
        rootMargin: "-18% 0px -62% 0px",
        threshold: [0.12, 0.24, 0.36, 0.48],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return activeSection;
}

function useScrollState() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [nearContact, setNearContact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateScrollState = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const contact = document.getElementById("contact");

      setIsScrolled(scrollTop > 460);

      if (!contact) {
        setNearContact(false);
        return;
      }

      const contactTop = contact.getBoundingClientRect().top;
      setNearContact(contactTop < window.innerHeight * 0.82);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  return { isScrolled, nearContact };
}

function useSmoothAnchorLinks() {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const handleClick = (event) => {
      const link = event.target.closest?.("a[href^='#']");

      if (!link) return;

      const href = link.getAttribute("href");

      if (!href || href === "#") return;

      const id = href.slice(1);
      const target = document.getElementById(id);

      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    };

    document.addEventListener("click", handleClick);

    return () => document.removeEventListener("click", handleClick);
  }, []);
}

function useRevealOnScroll() {
  useEffect(() => {
    if (typeof document === "undefined" || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) return undefined;

    const targets = Array.from(
      document.querySelectorAll(
        [
          "section > div",
          "section article",
          "section form",
          "section li",
          "footer > div",
        ].join(",")
      )
    ).filter((element) => !element.dataset.zaifanRevealBound);

    targets.forEach((element) => {
      element.dataset.zaifanRevealBound = "true";
      element.classList.add("zaifan-reveal-init");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("zaifan-reveal-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      }
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);
}

function SectionProgressPill({ activeSection }) {
  const label = SECTION_LABELS[activeSection] || "Explore";

  return (
    <motion.button
      type="button"
      onClick={() => scrollToSection(activeSection)}
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed left-1/2 top-4 z-[80] hidden -translate-x-1/2 items-center gap-2 rounded-full border border-orange-200/80 bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-orange-700 shadow-[0_18px_45px_rgba(154,92,31,0.16)] backdrop-blur-xl lg:flex"
    >
      <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.8)]" />
      {label}
    </motion.button>
  );
}

function FloatingConsultationCTA({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="fixed bottom-5 left-4 right-4 z-[90] mx-auto max-w-[560px] rounded-[1.6rem] border border-orange-200/80 bg-white/92 p-3 shadow-[0_26px_75px_rgba(124,45,18,0.22)] backdrop-blur-xl md:left-auto md:right-6 md:mx-0 md:max-w-[430px]"
        >
          <div className="flex items-center gap-3">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 sm:flex">
              <Sparkles className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[#2d145f]">
                Ready for free study guidance?
              </p>
              <p className="truncate text-xs font-bold text-slate-500">
                Submit your inquiry or chat on WhatsApp.
              </p>
            </div>

            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700"
            >
              <CalendarCheck className="h-4 w-4" />
              Book
            </button>

            <a
              href="https://wa.me/923305718131"
              target="_blank"
              rel="noreferrer"
              aria-label="Chat with Zaifan Consultancy on WhatsApp"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-green-200 bg-green-50 text-green-600 transition hover:-translate-y-0.5 hover:bg-green-100"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BackToTopButton({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.82 }}
          className="fixed bottom-24 right-5 z-[85] hidden h-12 w-12 items-center justify-center rounded-2xl border border-orange-200 bg-white/90 text-orange-600 shadow-[0_18px_45px_rgba(154,92,31,0.16)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-orange-50 lg:flex"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function PublicWebsitePolishLayer() {
  const activeSection = useActiveSection();
  const { isScrolled, nearContact } = useScrollState();
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  const showFloatingCTA = useMemo(
    () => isScrolled && !nearContact,
    [isScrolled, nearContact]
  );

  useSmoothAnchorLinks();
  useRevealOnScroll();

  return (
    <>
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        .zaifan-reveal-init {
          opacity: 0;
          transform: translateY(22px);
          transition:
            opacity 720ms cubic-bezier(.22,1,.36,1),
            transform 720ms cubic-bezier(.22,1,.36,1),
            box-shadow 300ms ease,
            border-color 300ms ease,
            background-color 300ms ease;
          will-change: opacity, transform;
        }

        .zaifan-reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .zaifan-reveal-init {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {!shouldReduceMotion && (
        <motion.div
          className="fixed left-0 top-0 z-[120] h-1 origin-left bg-gradient-to-r from-orange-400 via-amber-400 to-orange-600"
          style={{ scaleX }}
        />
      )}

      <SectionProgressPill activeSection={activeSection} />
      <FloatingConsultationCTA show={showFloatingCTA} />
      <BackToTopButton show={isScrolled} />
    </>
  );
}
