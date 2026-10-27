import { countryIndex as countryList } from "../../../data/countries/countryIndex";
import { ConsultationBand, SectionHeader } from "../destinations/DestinationUI";
import { FaqList } from "../destinations/DetailSections";

const FAQS = [
  {
    q: "Which country is best for Pakistani students?",
    a: "It depends on your budget, subject and career plan. Germany suits engineering on a low tuition budget, Italy and France offer income-based support, Turkey and China have fully funded government scholarships, and Romania is popular for medicine. We compare them for your profile.",
  },
  {
    q: "Is the first consultation really free?",
    a: "Yes. Your first consultation is free. We review your grades, budget and goals and tell you honestly which options fit, including when a country doesn't.",
  },
  {
    q: "Do you guarantee admission, scholarships or visas?",
    a: "No, and nobody honestly can. Universities, scholarship bodies and embassies make those decisions. We make your application as strong and complete as possible.",
  },
  {
    q: "When should I start my application?",
    a: "Ideally 9–12 months before your intake. Tests, document attestation, applications and visa appointments all take longer than most students expect.",
  },
  {
    q: "Can I study abroad with a 14-year degree?",
    a: "For many European master's programmes you need 16 years of education. Some countries and programmes are more flexible, so we check your exact case.",
  },
  {
    q: "Which documents should I prepare first?",
    a: "A valid passport, IBCC-attested school certificates, HEC-attested degree and transcripts (for master's), and an English test like IELTS. Those unlock most applications.",
  },
];

function GeneralFaq() {
  return (
    <>
      <section className="bg-[#fff7ed] px-4 py-16 text-[#071f50] sm:px-5 md:py-20">
        <div className="mx-auto max-w-[1000px]">
          <div>
            <SectionHeader
              eyebrow="Questions"
              title="Before you start."
              text={`Straight answers about studying in ${countryList.length} countries with Zaifan.`}
            />
            <FaqList faqs={FAQS} />
          </div>
        </div>
      </section>
      <div className="bg-[#fff7ed]">
        <ConsultationBand
          title="Your plan starts with one conversation."
          text="Tell us your grades, budget and dream subject. We'll come back with countries, universities and a timeline that actually fit."
          to="/appointment?service=Free%20Consultation"
          label="Book my free consultation"
        />
      </div>
    </>
  );
}

export default GeneralFaq;
