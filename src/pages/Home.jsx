import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import Stats from "../components/Stats"
import Services from "../components/Services"
import About from "../components/About"
import Trust from "../components/Trust"
import Countries from "../components/Countries"
import Process from "../components/Process"
import Testimonials from "../components/Testimonials"
import FAQ from "../components/FAQ"
import Contact from "../components/Contact"
import Footer from "../components/Footer"
import WhatsAppButton from "../components/WhatsAppButton"
import Chatbot from "../components/Chatbot"

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <Services />
      <Process />
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
    </>
  )
}

export default Home