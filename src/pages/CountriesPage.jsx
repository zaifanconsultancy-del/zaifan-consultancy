import PageHeader from "../components/PageHeader";
import Countries from "../components/Countries";

function CountriesPage() {
  return (
    <>
      <PageHeader
        badge="Study Destinations"
        title="Choose the right country for"
        highlight="your future."
        text="Compare popular study destinations based on budget, academics, scholarships, visa options and long-term opportunities."
      />
      <Countries />
    </>
  );
}

export default CountriesPage;