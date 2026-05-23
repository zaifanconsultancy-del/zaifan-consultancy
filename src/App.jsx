import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "./components/Navbar";
import LivePopup from "./components/LivePopup";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import Chatbot from "./components/Chatbot";
import ScrollToTop from "./components/ScrollToTop";
import CursorGlow from "./components/CursorGlow";
import AppointmentBooking from "./components/AppointmentBooking";

import Home from "./pages/Home";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import CountriesPage from "./pages/CountriesPage";
import ContactPage from "./pages/ContactPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";

function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#050505] text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute h-[420px] w-[420px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="mx-auto mb-8 h-20 w-20 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37]"
        />

        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Zaifan <span className="text-[#D4AF37]">Consultancy</span>
        </h1>

        <p className="mt-4 text-sm uppercase tracking-[0.35em] text-gray-400">
          Preparing your gateway to global success
        </p>
      </motion.div>
    </motion.div>
  );
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const isAdminPage = location.pathname === "/admin";

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-white selection:bg-[#D4AF37] selection:text-black">
      <CursorGlow />

      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>

      {!loading && (
        <>
          <ScrollToTop />

          {!isAdminPage && <Navbar />}

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
                path="/about"
                element={
                  <PageTransition>
                    <AboutPage />
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
                path="/contact"
                element={
                  <PageTransition>
                    <ContactPage />
                  </PageTransition>
                }
              />

              <Route
                path="/appointment"
                element={
                  <PageTransition>
                    <AppointmentBooking />
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
                path="*"
                element={
                  <PageTransition>
                    <NotFoundPage />
                  </PageTransition>
                }
              />
            </Routes>
          </AnimatePresence>

          {!isAdminPage && (
            <>
              <LivePopup />
              <Footer />
              <WhatsAppButton />
              <Chatbot />
            </>
          )}
        </>
      )}
    </main>
  );
}

export default App;