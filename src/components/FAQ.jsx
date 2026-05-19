import { useState } from "react"
import { FaPlus, FaMinus } from "react-icons/fa"

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
  ]

  const [active, setActive] = useState(null)

  const toggleFAQ = (index) => {
    setActive(active === index ? null : index)
  }

  return (
    <section className="py-28 bg-[#111111] text-white px-6">
      <div className="max-w-5xl mx-auto">

        <div className="text-center max-w-2xl mx-auto">
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            FAQ
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
            Frequently asked questions.
          </h2>

          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            Clear answers for students planning their international education journey.
          </p>
        </div>

        <div className="mt-16 space-y-5">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between text-left px-8 py-6"
              >
                <h3 className="text-lg md:text-xl font-semibold">
                  {faq.question}
                </h3>

                <div className="text-amber-200">
                  {active === index ? <FaMinus /> : <FaPlus />}
                </div>
              </button>

              {active === index && (
                <div className="px-8 pb-8 text-gray-400 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ