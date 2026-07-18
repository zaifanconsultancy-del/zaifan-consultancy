import Hero from "../components/Hero";
import Services from "../components/DreamSupportSection";
import Countries from "../components/Countries";
import MoreWaysWeHelp from "../components/public/MoreWaysWeHelp";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import PublicUniversityExplorer from "../components/PublicUniversityExplorer";

function Home() {
  return (
    <>
      <Hero />

      <div className="relative">
        <Services />
        <Countries />
        <PublicUniversityExplorer />
        <MoreWaysWeHelp />
        <Contact />
        <Footer />
      </div>
    </>
  );
}

export default Home;