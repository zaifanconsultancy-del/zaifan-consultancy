import { motion } from "framer-motion";

function About() {
  const features = [
    "Profile evaluation based on academics & budget",
    "University shortlist guidance",
    "Visa & documentation support",
    "Scholarship assistance",
    "Transparent consultation process",
    "Step-by-step student guidance",
  ];

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#0b0b0b] py-32 px-6 text-white"
    >
      <div className="absolute top-[-15%] left-[-10%] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] h-[520px] w-[520px] rounded-full bg-yellow-100/5 blur-3xl"></div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -55 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
        >
          <span className="text-base md:text-lg uppercase tracking-[0.35em] font-semibold text-[#E7C768]/80">
            About
          </span>

          <h2 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Honest guidance for students planning to{" "}
            <span className="text-[#D4AF37]">study abroad.</span>
          </h2>

          <p className="mt-7 text-lg leading-relaxed text-gray-400">
            Zaifan Consultancy helps students navigate the study abroad process
            with clarity, structure and professional support.
          </p>

          <p className="mt-5 text-lg leading-relaxed text-gray-400">
            From university applications to scholarships, documents and visa
            preparation — every step is handled with careful guidance.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-5 max-w-lg">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-3xl font-bold text-[#D4AF37]">100%</h3>
              <p className="mt-2 text-sm text-gray-400">Transparent Process</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-3xl font-bold text-[#D4AF37]">1-on-1</h3>
              <p className="mt-2 text-sm text-gray-400">Student Guidance</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 55 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="relative rounded-[2.5rem] border border-white/10 bg-white/[0.05] p-10 backdrop-blur-xl shadow-2xl"
        >
          <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br from-[#D4AF37]/20 via-transparent to-transparent opacity-60 blur-xl"></div>

          <div className="relative">
            <h3 className="text-3xl font-bold text-white">
              Why Students Choose Us
            </h3>

            <div className="mt-10 space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="group flex items-center gap-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 font-bold text-[#E7C768] transition group-hover:scale-110">
                    ✓
                  </div>

                  <p className="text-lg text-gray-300">{feature}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default About;