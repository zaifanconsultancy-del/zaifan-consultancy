import Hero from "../../components/public/home/Hero";
import DestinationsShowcase from "../../components/public/home/DestinationsShowcase";
import BudgetMatcher from "../../components/public/home/BudgetMatcher";
import Services from "../../components/public/home/DreamSupportSection";
import FeaturedUniversities from "../../components/public/home/FeaturedUniversities";
import MoreWaysWeHelp from "../../components/public/home/MoreWaysWeHelp";
import HomeFaq from "../../components/public/home/HomeFaq";
import Contact from "../../components/public/contact/Contact";
import Footer from "../../components/public/layout/Footer";
import { DripDivider } from "../../components/public/destinations/DestinationUI";

function Home() {
  return (
    <>
      <Hero />

      <main className="relative">
        <DestinationsShowcase />
        <DripDivider color="#fff7ed" background="#071f50" />
        <BudgetMatcher />
        <DripDivider color="#071f50" background="#fff7ed" />
        <Services />
        <FeaturedUniversities />
        <MoreWaysWeHelp />
        <HomeFaq />
        <Contact />
      </main>

      <Footer />
    </>
  );
}

export default Home;
