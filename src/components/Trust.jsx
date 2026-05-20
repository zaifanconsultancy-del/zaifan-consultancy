import { motion } from "framer-motion";

function Trust() {
  const points = [
    "Student-focused consultancy approach",
    "Clear and transparent guidance",
    "Support throughout application journey",
    "Professional help for admissions and visas",
  ];

  return (
    <section className="relative overflow-hidden bg-[#050505] px-6 py-28 text-white">
      {/* SAME PREMIUM BLOBS */}
      <div className="absolute top-[-15%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
            Why Choose Us
          </p>

          <h2 className="mt-6 text-4xl font-extrabold leading-tight md:text-6xl">
            Honest guidance for students planning to{" "}
            <span className="text-[#D4AF37]">study abroad.</span>
          </h2>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-gray-400">
            Zaifan Consultancy focuses on clarity, transparency and professional
            support for students aiming for international education.
          </p>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl"
        >
          <div className="space-y-7">
            {points.map((point, index) => (
              <div
                key={index}
                className="group flex items-center gap-5"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-2xl text-[#D4AF37] transition duration-300 group-hover:-translate-y-1">
                  ✓
                </div>

                <p className="text-xl leading-relaxed text-gray-300">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Trust;