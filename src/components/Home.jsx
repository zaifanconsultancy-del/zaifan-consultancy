import Hero from "../components/Hero";
import Services from "./DreamSupportSection";
import Countries from "../components/Countries";
import FAQ from "../components/FAQ";
import Contact from "../components/Contact";

function Home() {
  return (
    <>
      <Hero />

      <div className="relative">
        <Services />
        <Countries />
        <FAQ />
        <Contact />
      </div>
    </>
  );
}

export default Home;