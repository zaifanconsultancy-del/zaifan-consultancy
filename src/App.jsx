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
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Services />
      <About />
      <Trust />
      <Countries />
      <Process />
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
      <WhatsAppButton />
      <Chatbot />
    </div>
  );
}

export default App;