import PageHeader from "../components/PageHeader";
import Services from "../components/Services";

function ServicesPage() {
  return (
    <>
      <PageHeader
        badge="Our Services"
        title="Premium support for your"
        highlight="study journey."
        text="Explore our complete consultancy services for admissions, scholarships, SOPs, documentation and visa preparation."
      />
      <Services />
    </>
  );
}

export default ServicesPage;