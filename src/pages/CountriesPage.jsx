import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import Countries from "../components/Countries";

function CountriesPage() {
  const points = [
    {
      title: "Budget Planning",
      text: "Compare tuition fees, living costs and financial requirements before choosing a destination.",
    },
    {
      title: "Study Pathway",
      text: "Understand admission options, academic fit and long-term career opportunities.",
    },
    {
      title: "Visa Direction",
      text: "Get guidance about documentation, interview preparation and application strategy.",
    },
  ];

  return (
    <>
      <PageHeader
        badge="Study Destinations"
        title="Choose the right country for"
        highlight="your future."
        text="Compare popular study destinations based on budget, academics, scholarships, visa options and long-term opportunities."
      />

      <section className="relative overflow-hidden bg-[#050505] px-6 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {points.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -7 }}
              className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/40 hover:bg-white/[0.06]"
            >
              <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5D97B]"></div>

              <h3 className="mt-6 text-2xl font-bold text-white">
                {item.title}
              </h3>

              <p className="mt-4 leading-relaxed text-gray-400">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <Countries />
    </>
  );
}

export default CountriesPage;