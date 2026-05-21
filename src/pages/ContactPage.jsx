import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import Contact from "../components/Contact";

function ContactPage() {
  const highlights = [
    "Free profile evaluation",
    "Country selection guidance",
    "Admissions & visa support",
  ];

  return (
    <>
      <PageHeader
        badge="Contact Us"
        title="Start your study abroad"
        highlight="journey today."
        text="Reach out to Zaifan Consultancy for profile evaluation, country guidance, admissions support and visa preparation."
      />

      {/* HIGHLIGHTS */}
      <section className="relative overflow-hidden bg-[#050505] px-6 pb-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {highlights.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: index * 0.1,
              }}
              viewport={{ once: true }}
              whileHover={{
                y: -6,
              }}
              className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/40 hover:bg-white/[0.06]"
            >
              {/* GOLD LINE */}
              <div className="mx-auto h-1.5 w-16 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5D97B]"></div>

              <h3 className="mt-6 text-2xl font-bold leading-snug text-white">
                {item}
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-gray-400">
                Professional overseas education consultancy support tailored
                for your academic goals and future plans.
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <Contact />
    </>
  );
}

export default ContactPage;