import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

import ContactHero from "../../components/public/contact/ContactHero";
import PostcardForm from "../../components/public/contact/PostcardForm";
import ReachUs from "../../components/public/contact/ReachUs";
import Footer from "../../components/public/layout/Footer";
import { DripDivider, ZAIFAN_NAVY } from "../../components/public/destinations/DestinationUI";

// Contact as an information desk: Desk A (ask a question, the inquiry form)
// and Desk B (book a call time, the appointment page), then every other
// channel and the general FAQ.
function ContactPage() {
  const location = useLocation();

  // Carry the visitor's country over to the booking page.
  const bookingHref = useMemo(() => {
    const country = new URLSearchParams(location.search).get("country");
    return country ? `/appointment?country=${encodeURIComponent(country)}` : "/appointment";
  }, [location.search]);

  useEffect(() => {
    document.title = "Contact | Zaifan Consultancy";
  }, []);

  useEffect(() => {
    if (!location.hash) return undefined;
    const timer = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" }), 300);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  return (
    <>
      <main className="overflow-x-clip bg-[#fff7ed] text-[#071f50]">
        <ContactHero bookingHref={bookingHref} />
        <DripDivider background={ZAIFAN_NAVY} />
        <PostcardForm bookingHref={bookingHref} />
        <DripDivider color={ZAIFAN_NAVY} background="#fff7ed" />
        <ReachUs bookingHref={bookingHref} />
      </main>

      <Footer />
    </>
  );
}

export default ContactPage;
