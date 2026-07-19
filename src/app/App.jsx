import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "../components/public/layout/Navbar";
import ScrollToTop from "../components/public/shared/ScrollToTop";
import FloatingConsultationCTA from "../components/public/layout/FloatingConsultationCTA";
import loadingLogo from "../assets/images/brand/loading-logo.webp";

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
const CounselorPortalPage = lazy(() =>
  import("../pages/portals/CounselorPortalPage")
);

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const portalRoutes = ["/admin", "/student", "/counselor"];

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

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center bg-[#fff4e8] px-6 text-[#071d43]">
      <div className="flex flex-col items-center text-center">
        <img
          src={loadingLogo}
          alt=""
          aria-hidden="true"
          className="h-20 w-20 object-contain"
        />

        <div className="mt-5 h-2 w-44 overflow-hidden rounded-full bg-orange-100">
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

        <p className="mt-4 text-xs font-black uppercase tracking-[0.26em] text-slate-500">
          Loading page
        </p>
      </div>
    </div>
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

function ContactRoute() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const contactSection = document.getElementById("contact");

      if (!contactSection) return;

      const navbarOffset = 88;
      const targetTop =
        contactSection.getBoundingClientRect().top +
        window.scrollY -
        navbarOffset;

      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, []);

  return <Home />;
}

function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const isPortalRoute = useMemo(
    () =>
      portalRoutes.some((route) => location.pathname.startsWith(route)),
    [location.pathname]
  );

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

          {!isPortalRoute && <Navbar />}
          {!isPortalRoute && <FloatingConsultationCTA />}

          <Suspense fallback={<RouteLoadingFallback />}>
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
                      <ContactRoute />
                    </PageTransition>
                  }
                />

                <Route
                  path="/consultation"
                  element={
                    <PageTransition>
                      <ContactRoute />
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
                  element={
                    <PageTransition>
                      <AdminPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/student"
                  element={
                    <PageTransition>
                      <StudentPortalPage />
                    </PageTransition>
                  }
                />

                <Route
                  path="/counselor"
                  element={
                    <PageTransition>
                      <CounselorPortalPage />
                    </PageTransition>
                  }
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
        </>
      )}
    </main>
  );
}

export default App;
