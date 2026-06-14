import Hero from "../components/Hero";
import Services from "./DreamSupportSection";
import About from "../components/About";
import Trust from "../components/Trust";
import Stats from "../components/Stats";
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

        {/* Hidden for now */}
        {/* <About /> */}
        {/* <Trust /> */}
        {/* <Stats /> */}

        <Countries />

        {/* Hidden for now */}
        {/* <Process /> */}

        <Testimonials />

        <FAQ />

        <Contact />
      </div>
    </>
  );
}

export default Home;