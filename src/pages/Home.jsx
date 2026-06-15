import Hero from "../components/Hero";
import Services from "../components/DreamSupportSection";
import Countries from "../components/Countries";
import PublicUniversityExplorer from "../components/PublicUniversityExplorer";

import MoreWaysWeHelp from "../components/public/MoreWaysWeHelp";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Countries />
      <PublicUniversityExplorer />
      
      <MoreWaysWeHelp />
      <Contact />
      <Footer />
    </>
  );
}

export default Home;