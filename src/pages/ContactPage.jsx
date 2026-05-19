import PageHeader from "../components/PageHeader";
import Contact from "../components/Contact";

function ContactPage() {
  return (
    <>
      <PageHeader
        badge="Contact Us"
        title="Start your study abroad"
        highlight="journey today."
        text="Reach out to Zaifan Consultancy for profile evaluation, country guidance, admissions support and visa preparation."
      />
      <Contact />
    </>
  );
}

export default ContactPage;