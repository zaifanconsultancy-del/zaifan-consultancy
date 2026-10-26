import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { countryList } from "../../../data/countries";
import { ConsultationBand, SectionHeader } from "../destinations/DestinationUI";

const FAQS = [
  {
    q: "Which country is best for Pakistani students?",
    a: "It depends on your budget, subject and career plan. Germany suits engineering on a low tuition budget, Italy offers DSU scholarships, Turkey and China have fully funded government scholarships, and Romania is popular for medicine. We compare them for your profile.",
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

function HomeFaq() {
  const [open, setOpen] = useState(0);

  return (
    <>
      <section className="bg-[#fff7ed] px-4 py-16 text-[#071f50] sm:px-5 md:py-20">
        <div className="mx-auto max-w-[1000px]">
          <SectionHeader eyebrow="Questions" title="Before you start." text={`Straight answers about studying in ${countryList.length} countries with Zaifan.`} />
          <div className="mt-10 space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = open === index;
              return (
                <div key={faq.q} className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_40px_rgba(9,31,80,0.06)] ring-1 ring-orange-100">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-black tracking-[-0.02em]">{faq.q}</span>
                    <ChevronDown size={20} className={`shrink-0 text-[#ff4b12] transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <p className="px-5 pb-5 text-sm font-semibold leading-7 text-[#61708a] md:px-6">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
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

export default HomeFaq;
