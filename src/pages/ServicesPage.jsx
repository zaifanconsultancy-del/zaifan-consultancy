import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import Services from "../components/Services";

function ServicesPage() {
  const features = [
    {
      title: "Experienced Guidance",
      text: "Professional support for selecting the right country, university and study pathway.",
    },
    {
      title: "Transparent Process",
      text: "Clear guidance throughout admissions, documentation and visa preparation.",
    },
    {
      title: "Student Focused",
      text: "Every application strategy is tailored according to the student's profile and goals.",
    },
  ];

  return (
    <>
      <PageHeader
        badge="Our Services"
        title="Premium support for your"
        highlight="study journey."
        text="Explore our complete consultancy services for admissions, scholarships, SOPs, documentation and visa preparation."
      />

      <section className="relative overflow-hidden bg-[#050505] px-6 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {features.map((item, index) => (
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

      <Services />
    </>
  );
}

export default ServicesPage;