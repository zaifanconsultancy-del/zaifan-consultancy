import Hero from "../components/Hero";
import Services from "../components/Services";
import About from "../components/About";
import Trust from "../components/Trust";
import Countries from "../components/Countries";
import Process from "../components/Process";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import Contact from "../components/Contact";

function Home() {
  return (
    <>
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
    </>
  );
}

export default Home;