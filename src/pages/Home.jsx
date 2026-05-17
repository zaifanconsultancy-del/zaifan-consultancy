import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import Services from "../components/Services"
import About from "../components/About"
import Countries from "../components/Countries"
import Testimonials from "../components/Testimonials"
import Contact from "../components/Contact"
import Footer from "../components/Footer"
import WhatsAppButton from "../components/WhatsAppButton"
import Chatbot from "../components/Chatbot"

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <About />
      <Countries />
      <Testimonials />
      <Contact />
      <Footer />
      <WhatsAppButton />
      <Chatbot />
    </>
  )
}

export default Home