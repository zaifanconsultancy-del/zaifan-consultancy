import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Heart } from "lucide-react";

import { countryContextFor, findUniversity, similarUniversities } from "../../data/universities";
import { DripDivider, ZAIFAN_NAVY, ZAIFAN_ORANGE } from "../../components/public/destinations/DestinationUI";
import ProfileHero from "../../components/public/universities/ProfileHero";
import { ApplySection, CitySection, CoursesSection, FaqSection, MoneySection, OverviewSection, SimilarSection } from "../../components/public/universities/ProfileSections";
import UniTalk from "../../components/public/universities/UniTalk";
import { cityFor, faqsFor, fitFor } from "../../components/public/universities/profileData";
import { useShortlist } from "../../components/public/universities/useShortlist";
import NotFoundPage from "./NotFoundPage";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "courses", label: "Courses" },
  { id: "money", label: "Money" },
  { id: "apply", label: "Apply" },
  { id: "city", label: "City" },
  { id: "faqs", label: "FAQs" },
];

function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  return active;
}

/** Floating dock: jump between sections, and save the university. */
function SectionDock({ active, saved, onToggleSave }) {
  return (
    <motion.nav
      aria-label="Sections on this page"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-x-0 bottom-4 z-[9990] flex justify-center px-3"
    >
      <div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full bg-[#071f50] p-1.5 text-white shadow-[0_24px_60px_rgba(7,31,80,0.45)] ring-1 ring-white/10 [scrollbar-width:none]">
        {SECTIONS.map((section) => {
          const current = section.id === active;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={current ? "location" : undefined}
              className={`relative shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${current ? "text-white" : "text-white/55 hover:text-white"}`}
            >
              {current && <motion.span layoutId="uni-profile-dock" className="absolute inset-0 rounded-full bg-[#ff4b12]" />}
              <span className="relative">{section.label}</span>
            </a>
          );
        })}
        <span className="h-7 w-px shrink-0 bg-white/15" />
        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#071f50] transition hover:bg-[#ffb36d]"
        >
          <Heart size={16} strokeWidth={2.6} fill={saved ? "#ff4b12" : "none"} className={saved ? "text-[#ff4b12]" : ""} />
        </button>
      </div>
    </motion.nav>
  );
}

// One profile template for every university: /universities/:slug (Italy) and
// /countries/:countrySlug/universities/:universitySlug (everyone else).
function UniversityPage() {
  const { slug, countrySlug, universitySlug } = useParams();
  const university = countrySlug ? findUniversity(countrySlug, universitySlug) : findUniversity("italy", slug);
  const context = university ? countryContextFor(university.countrySlug) : null;
  const shortlist = useShortlist();
  const active = useActiveSection();
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { amount: 0.2 });

  const derived = useMemo(() => {
    if (!university || !context) return null;
    const city = cityFor(university, context);
    return {
      city,
      fit: fitFor(university, context, city),
      faqs: faqsFor(university, context, context, city),
      similar: similarUniversities(university, 4),
    };
  }, [university, context]);

  useEffect(() => {
    if (university) document.title = `${university.name} | Zaifan Consultancy`;
  }, [university]);

  if (!university || !context || !derived) return <NotFoundPage />;

  const saved = shortlist.has(university.key);
  const toggleSave = () => shortlist.toggle(university.key);
  const bookPath = `/appointment?country=${encodeURIComponent(context.name)}&service=${encodeURIComponent("University Selection")}&university=${encodeURIComponent(university.name)}`;

  return (
    <main className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      <div ref={heroRef}>
        <ProfileHero university={university} country={context} saved={saved} onToggleSave={toggleSave} bookPath={bookPath} />
      </div>
      <DripDivider background={ZAIFAN_NAVY} />
      <OverviewSection university={university} />
      <DripDivider color={ZAIFAN_NAVY} background="#fff7ed" />
      <CoursesSection university={university} fit={derived.fit} />
      <DripDivider background={ZAIFAN_ORANGE} />
      <MoneySection university={university} context={context} city={derived.city} />
      <DripDivider color={ZAIFAN_ORANGE} background="#fff7ed" />
      <ApplySection university={university} context={context} />
      <DripDivider background={ZAIFAN_NAVY} />
      <CitySection university={university} context={context} city={derived.city} />
      <DripDivider color={ZAIFAN_NAVY} background="#fff7ed" />
      <SimilarSection university={university} similar={derived.similar} shortlist={shortlist} />
      <DripDivider background={ZAIFAN_ORANGE} />
      <FaqSection university={university} faqs={derived.faqs} />
      <DripDivider color={ZAIFAN_ORANGE} background="#fff7ed" />
      <UniTalk universities={[university]} />

      <AnimatePresence>{!heroInView && <SectionDock active={active} saved={saved} onToggleSave={toggleSave} />}</AnimatePresence>
    </main>
  );
}

export default UniversityPage;
