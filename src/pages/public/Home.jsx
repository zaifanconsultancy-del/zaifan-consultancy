import Hero from "../../components/public/home/Hero";
import Services from "../../components/public/home/DreamSupportSection";
import Countries from "../../components/public/home/Countries";
import MoreWaysWeHelp from "../../components/public/home/MoreWaysWeHelp";
import Contact from "../../components/public/contact/Contact";
import Footer from "../../components/public/layout/Footer";
import PublicUniversityExplorer from "../../components/public/home/PublicUniversityExplorer";

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