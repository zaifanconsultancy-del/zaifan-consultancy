import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import About from "./components/About";
import Trust from "./components/Trust";
import Countries from "./components/Countries";
import Process from "./components/Process";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import Chatbot from "./components/Chatbot";

function App() {
  return (
    <main className="overflow-x-hidden bg-[#050505] text-white selection:bg-[#D4AF37] selection:text-black">

      {/* Navbar */}
      <Navbar />

      {/* Main Sections */}
      <Hero />

      <div className="relative">
        <Services />
        <About />
        <Trust />
        <Countries />
        <Process />
        <Testimonials />
        <FAQ />
        <Contact />
      </div>

      {/* Footer */}
      <Footer />

      {/* Floating Buttons */}
      <WhatsAppButton />
      <Chatbot />

    </main>
  );
}

export default App;