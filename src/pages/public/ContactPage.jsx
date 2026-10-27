import Contact from "../../components/public/contact/Contact";
import GeneralFaq from "../../components/public/contact/GeneralFaq";
import Footer from "../../components/public/layout/Footer";
import { DripDivider, ZAIFAN_ORANGE } from "../../components/public/destinations/DestinationUI";

function ContactPage() {
  return (
    <>
      <main className="pt-24">
        <Contact />
        <DripDivider color={ZAIFAN_ORANGE} background="#fff7ed" />
        <GeneralFaq />
      </main>

      <Footer />
    </>
  );
}

export default ContactPage;
