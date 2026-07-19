import { useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "../components/public/layout/Navbar";
import ScrollToTop from "../components/public/shared/ScrollToTop";
import FloatingConsultationCTA from "../components/public/layout/FloatingConsultationCTA";
import loadingLogo from "../assets/images/brand/loading-logo.png";

import Home from "../pages/public/Home";
import ServicesPage from "../pages/public/ServicesPage";
import ServiceDetailPage from "../pages/public/ServiceDetailPage.jsx";
import CountriesPage from "../pages/public/CountriesPage";
import ItalyGuide from "../pages/public/ItalyGuide";
import CityDetailPage from "../pages/public/CityDetailPage";
import UniversitiesPage from "../pages/public/UniversitiesPage";
import UniversityDetailPage from "../pages/public/UniversityDetailPage";
import ScholarshipExplorer from "../components/public/scholarships/ScholarshipExplorer";
import AppointmentPage from "../pages/public/AppointmentPage.jsx";
import NotFoundPage from "../pages/public/NotFoundPage.jsx";

import AdminPage from "../pages/portals/AdminPage";
import StudentPortalPage from "../pages/portals/StudentPortalPage";
import CounselorPortalPage from "../pages/portals/CounselorPortalPage";

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
        </>
      )}
    </main>
  );
}

export default App;
