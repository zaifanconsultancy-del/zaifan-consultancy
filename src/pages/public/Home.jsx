import Hero from "../../components/public/home/Hero";
import Services from "../../components/public/home/DreamSupportSection";
import Countries from "../../components/public/home/Countries";
import PublicUniversityExplorer from "../../components/public/home/PublicUniversityExplorer";
import MoreWaysWeHelp from "../../components/public/home/MoreWaysWeHelp";
import Contact from "../../components/public/contact/Contact";
import Footer from "../../components/public/layout/Footer";

function Home() {
  return (
    <>
      <Hero />

      <main className="relative">
        <Services />
        <Countries />
        <PublicUniversityExplorer />
        <MoreWaysWeHelp />
        <Contact />
      </main>

      <Footer />
    </>
  );
}

export default Home;