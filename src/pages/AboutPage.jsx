import PageHeader from "../components/PageHeader";
import About from "../components/About";
import Trust from "../components/Trust";

function AboutPage() {
  return (
    <>
      <PageHeader
        badge="About Zaifan"
        title="Honest guidance with"
        highlight="clear direction."
        text="Learn how Zaifan Consultancy supports students with transparent, structured and professional study abroad guidance."
      />
      <About />
      <Trust />
    </>
  );
}

export default AboutPage;