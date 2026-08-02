import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import ScrollToTop from "../components/public/shared/ScrollToTop";
import loadingLogo from "../assets/images/brand/loading-logo.webp";

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
const UniversitiesPage = lazy(() =>
  import("../pages/public/UniversitiesPage")
);
const UniversityDetailPage = lazy(() =>
  import("../pages/public/UniversityDetailPage")
);
const ScholarshipExplorer = lazy(() =>
  import("../components/public/scholarships/ScholarshipExplorer")
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

function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#fff4e8] text-[#071d43]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: MOTION.duration, ease: MOTION.ease }}
        className="relative flex flex-col items-center text-center"
      >
        <img
          src={loadingLogo}
          alt="Zaifan Consultancy"
          className="h-36 w-36 object-contain drop-shadow-[0_18px_35px_rgba(234,88,12,0.18)] md:h-44 md:w-44"
          decoding="async"
        />

        <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
          Zaifan <span className="text-orange-600">Consultancy</span>
        </h1>

        <p className="mt-4 text-sm font-black uppercase tracking-[0.32em] text-slate-500">
          Loading your study abroad adventure
        </p>

        <div className="mt-7 h-2 w-56 overflow-hidden rounded-full bg-orange-100">
          <motion.div
            className="h-full rounded-full bg-orange-500"
            initial={{ x: "-100%", width: "45%" }}
            animate={{ x: "230%" }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
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
  const [loading, setLoading] = useState(true);

  const isPortalRoute = isPortalPath(location.pathname);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 350);

    return () => window.clearTimeout(timer);
  }, []);

  const routeKey = `${location.pathname}${location.search}`;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#fff4e8] text-[#071d43] selection:bg-orange-600 selection:text-white">
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>

      {!loading && (
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
                  path="/universities"
                  element={
                    <PageTransition>
                      <UniversitiesPage />
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
                      <ScholarshipExplorer />
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
