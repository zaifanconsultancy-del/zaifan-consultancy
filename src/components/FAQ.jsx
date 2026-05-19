import { useState } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaMinus } from "react-icons/fa";

function FAQ() {
  const faqs = [
    {
      question: "Which countries do you provide guidance for?",
      answer:
        "We guide students for multiple study destinations including Italy, Germany, UK, Canada, Australia and Turkey.",
    },
    {
      question: "Do you help with scholarships?",
      answer:
        "Yes. Scholarship opportunities are discussed based on academic profile, budget and country selection.",
    },
    {
      question: "Do you assist with SOPs and documents?",
      answer:
        "Yes. We help students with SOP guidance, document preparation and application support.",
    },
    {
      question: "Can you help with visa preparation?",
      answer:
        "Yes. We provide complete visa guidance including financial documents and interview preparation.",
    },
    {
      question: "How do I start the process?",
      answer:
        "You can contact Zaifan Consultancy through WhatsApp or the consultation form on the website.",
    },
  ];

  const [active, setActive] = useState(null);

  const toggleFAQ = (index) => {
    setActive(active === index ? null : index);
  };

  return (
    <section className="relative overflow-hidden bg-[#111111] py-32 px-6 text-white">

      {/* Glow */}
      <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-amber-200/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-5xl">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            FAQ
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Frequently asked{" "}
            <span className="text-[#D4AF37]">
              questions.
            </span>
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-gray-400">
            Clear answers for students planning their international education journey.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="mt-16 space-y-5">

          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 45 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.08,
              }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
            >

              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between px-8 py-7 text-left transition duration-300 hover:bg-white/[0.03]"
              >
                <h3 className="text-lg md:text-xl font-semibold text-white">
                  {faq.question}
                </h3>

                <div className="text-[#D4AF37] text-sm">
                  {active === index ? <FaMinus /> : <FaPlus />}
                </div>
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: active === index ? "auto" : 0,
                  opacity: active === index ? 1 : 0,
                }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden"
              >
                <div className="px-8 pb-8 leading-relaxed text-gray-400">
                  {faq.answer}
                </div>
              </motion.div>

            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default FAQ;