import { useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import loadingLogo from "./assets/loading-logo.png";

import Home from "./pages/Home";
import ServicesPage from "./pages/ServicesPage";
import CountriesPage from "./pages/CountriesPage";
import UniversitiesPage from "./pages/UniversitiesPage";
import UniversityDetailPage from "./pages/UniversityDetailPage";
import ScholarshipExplorer from "./components/ScholarshipExplorer";

import AdminPage from "./pages/AdminPage";
import StudentPortalPage from "./pages/StudentPortalPage";
import CounselorPortalPage from "./pages/CounselorPortalPage";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import AppointmentPage from "./pages/AppointmentPage.jsx";
import ItalyGuide from "./pages/ItalyGuide";
import CityDetailPage from "./pages/CityDetailPage";
import FloatingConsultationCTA from "./components/FloatingConsultationCTA";

function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#fff4e8] text-[#071d43]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center text-center"
      >
        <motion.img
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
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
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
      transition={{ duration: 0.32 }}
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

      if (contactSection) {
        const navbarOffset = 88;
        const targetTop =
          contactSection.getBoundingClientRect().top +
          window.scrollY -
          navbarOffset;

        window.scrollTo({ top: targetTop, behavior: "smooth" });
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, []);

  return <Home />;
}

function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const portalMode = useMemo(() => {
    const path = location.pathname;

    return {
      isAdminPage: path.startsWith("/admin"),
      isStudentPortal: path.startsWith("/student"),
      isCounselorPortal: path.startsWith("/counselor"),
    };
  }, [location.pathname]);

  const shouldShowNavbar =
    !portalMode.isAdminPage &&
    !portalMode.isStudentPortal &&
    !portalMode.isCounselorPortal;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#fff4e8] text-[#071d43] selection:bg-orange-600 selection:text-white">
      <AnimatePresence>{loading && <LoadingScreen />}</AnimatePresence>

      {!loading && (
        <>
          <ScrollToTop />

          {shouldShowNavbar && <Navbar />}
          {shouldShowNavbar && <FloatingConsultationCTA />}

          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
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
