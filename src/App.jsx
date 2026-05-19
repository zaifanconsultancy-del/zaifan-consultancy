import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import Chatbot from "./components/Chatbot";

import Home from "./pages/Home";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import CountriesPage from "./pages/CountriesPage";
import ContactPage from "./pages/ContactPage";

function App() {
  return (
    <main className="overflow-x-hidden bg-[#050505] text-white selection:bg-[#D4AF37] selection:text-black">

      {/* Navbar */}
      <Navbar />

      {/* Routes */}
      <Routes>

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Services */}
        <Route
          path="/services"
          element={<ServicesPage />}
        />

        {/* About */}
        <Route
          path="/about"
          element={<AboutPage />}
        />

        {/* Countries */}
        <Route
          path="/countries"
          element={<CountriesPage />}
        />

        {/* Contact */}
        <Route
          path="/contact"
          element={<ContactPage />}
        />

      </Routes>

      {/* Footer */}
      <Footer />

      {/* Floating Buttons */}
      <WhatsAppButton />
      <Chatbot />

    </main>
  );
}

export default App;