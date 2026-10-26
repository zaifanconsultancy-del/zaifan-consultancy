import { lazy, Suspense, useCallback, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import ScrollToTop from "../components/public/shared/ScrollToTop";
import OpeningAnimation from "../components/public/shared/OpeningAnimation";
import MoltenDripIntro from "../components/public/shared/MoltenDripIntro";
import GyroPortalIntro from "../components/public/shared/GyroPortalIntro";

// Public shell is lazy as well, so portal-only visits do not eagerly pull
// Navbar / floating CTA code into the initial route workload.
const Navbar = lazy(() => import("../components/public/layout/Navbar"));
const Footer = lazy(() => import("../components/public/layout/Footer"));
const FloatingConsultationCTA = lazy(() =>
  import("../components/public/layout/FloatingConsultationCTA")
);

// Route-level code splitting.
// These pages are loaded only when their route is visited.
const Home = lazy(() => import("../pages/public/Home"));
const ServicesPage = lazy(() => import("../pages/public/ServicesPage"));
const ServiceDetailPage = lazy(() =>
  import("../pages/public/ServiceDetailPage.jsx")
);
const CountriesPage = lazy(() => import("../pages/public/CountriesPage"));
const ItalyGuide = lazy(() => import("../pages/public/ItalyGuide"));
const CityDetailPage = lazy(() => import("../pages/public/CityDetailPage"));
const CountryGuidePage = lazy(() => import("../pages/public/CountryGuidePage"));
const CountryCityPage = lazy(() => import("../pages/public/CountryCityPage"));
const EuHubPage = lazy(() => import("../pages/public/EuHubPage"));
const UniversityProfilePage = lazy(() => import("../pages/public/UniversityProfilePage"));
const UniversitiesHub = lazy(() =>
  import("../pages/public/UniversitiesHub")
);
const UniversityDetailPage = lazy(() =>
  import("../pages/public/UniversityDetailPage")
);
const ScholarshipsHub = lazy(() =>
  import("../pages/public/ScholarshipsHub")
);
const ContactPage = lazy(() => import("../pages/public/ContactPage.jsx"));
const AppointmentPage = lazy(() =>
  import("../pages/public/AppointmentPage.jsx")
);
const NotFoundPage = lazy(() =>
  import("../pages/public/NotFoundPage.jsx")
);

const AdminPage = lazy(() => import("../pages/portals/AdminPage"));
const StudentPortalPage = lazy(() =>
  import("../pages/portals/StudentPortalPage")
);
const CounselorPortalGate = lazy(() =>
  import("../pages/portals/CounselorPortalGate")
);

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const PORTAL_PREFIXES = ["/admin", "/student", "/counselor"];

function isPortalPath(pathname) {
  return PORTAL_PREFIXES.some((route) => pathname.startsWith(route));
}

const INTRO_SESSION_KEY = "zaifan-intro-seen";

// Switch the default intro here. Preview any of them with ?intro=portal,
// ?intro=melt or ?intro=takeoff (the query param always replays, ignoring the session flag).
const DEFAULT_INTRO = "melt";
const INTROS = {
  takeoff: OpeningAnimation,
  melt: MoltenDripIntro,
  portal: GyroPortalIntro,
};

function getRequestedIntro() {
  const requested = new URLSearchParams(window.location.search).get("intro");
  return INTROS[requested] ? requested : null;
}

// The intro plays once per browser session, on public pages only.
function shouldPlayIntro(pathname) {
  if (isPortalPath(pathname)) return false;

  if (!getRequestedIntro()) {
    try {
      if (window.sessionStorage.getItem(INTRO_SESSION_KEY)) return false;
    } catch {
      // Storage blocked: still play the intro.
    }
  }

  // Warm the first-paint chunks while the intro runs.
  import("../components/public/layout/Navbar");
  import("../components/public/layout/FloatingConsultationCTA");
  if (pathname === "/") import("../pages/public/Home");

  return true;
}

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    // Ignore storage failures.
  }
}

// Kept short on purpose: AnimatePresence waits for the exit before showing the
// next page, so long transitions make every click feel laggy.
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: MOTION.ease } }}
      exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}

function PublicShell() {
  return (
    <Suspense fallback={null}>
      <Navbar />
      <FloatingConsultationCTA />
    </Suspense>
  );
}

function shouldRenderGlobalFooter(pathname) {
  if (isPortalPath(pathname)) return false;

  // Home and Contact already render their own Footer internally.
  return pathname !== "/" && pathname !== "/contact";
}

function App() {
  const location = useLocation();
  const isPortalRoute = isPortalPath(location.pathname);
  // playing -> revealing (site mounts under the intro) -> done
  const [introPhase, setIntroPhase] = useState(() =>
    shouldPlayIntro(location.pathname) ? "playing" : "done"
  );
  const [Intro] = useState(() => INTROS[getRequestedIntro() || DEFAULT_INTRO]);

  const revealSite = useCallback(() => {
    setIntroPhase((phase) => (phase === "playing" ? "revealing" : phase));
  }, []);

  const finishIntro = useCallback(() => {
    markIntroSeen();
    setIntroPhase("done");
  }, []);

  const routeKey = `${location.pathname}${location.search}`;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#fff4e8] text-[#071d43] selection:bg-orange-600 selection:text-white">
      <AnimatePresence>
        {introPhase !== "done" && (
          <Intro onReveal={revealSite} onComplete={finishIntro} />
        )}
      </AnimatePresence>

      {introPhase !== "playing" && (
        <>
          <ScrollToTop />

          {!isPortalRoute && <PublicShell />}

          <Suspense fallback={null}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={routeKey}>
                <Route
                  path="/"
                  element={
                    <PageTransition>
                      <Home />
                    </PageTransition>
                  }
                />

                <Route
                  path="/services"
                  element={
                    <PageTransition>
                      <ServicesPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/services/:serviceSlug"
                  element={
                    <PageTransition>
                      <ServiceDetailPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/countries"
                  element={
                    <PageTransition>
                      <CountriesPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/countries/italy"
                  element={
                    <PageTransition>
                      <ItalyGuide />
                    </PageTransition>
                  }
                />

                <Route
                  path="/countries/italy/:citySlug"
                  element={
                    <PageTransition>
                      <CityDetailPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/countries/european-union"
                  element={
                    <PageTransition>
                      <EuHubPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/countries/:countrySlug"
                  element={
                    <PageTransition>
                      <CountryGuidePage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/countries/:countrySlug/universities/:universitySlug"
                  element={
                    <PageTransition>
                      <UniversityProfilePage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/countries/:countrySlug/:citySlug"
                  element={
                    <PageTransition>
                      <CountryCityPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/universities"
                  element={
                    <PageTransition>
                      <UniversitiesHub />
                    </PageTransition>
                  }
                />

                <Route
                  path="/universities/:slug"
                  element={
                    <PageTransition>
                      <UniversityDetailPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/scholarships"
                  element={
                    <PageTransition>
                      <ScholarshipsHub />
                    </PageTransition>
                  }
                />

                <Route
                  path="/contact"
                  element={
                    <PageTransition>
                      <ContactPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/consultation"
                  element={
                    <PageTransition>
                      <AppointmentPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/appointment"
                  element={
                    <PageTransition>
                      <AppointmentPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/admin"
                  element={<AdminPage />}
                />

                <Route
                  path="/student"
                  element={<StudentPortalPage />}
                />

                <Route
                  path="/counselor"
                  element={<CounselorPortalGate />}
                />

                <Route
                  path="*"
                  element={
                    <PageTransition>
                      <NotFoundPage />
                    </PageTransition>
                  }
                />
              </Routes>
            </AnimatePresence>
          </Suspense>

          {shouldRenderGlobalFooter(location.pathname) && (
            <Suspense fallback={null}>
              <Footer />
            </Suspense>
          )}
        </>
      )}
    </main>
  );
}

export default App;
