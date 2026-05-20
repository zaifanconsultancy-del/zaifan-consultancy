import { motion } from "framer-motion";

function About() {
  const features = [
    "Transparent consultation process",
    "Step-by-step student guidance",
    "Support from admission to visa",
    "Profile-based country recommendations",
  ];

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#050505] px-6 py-28 text-white"
    >
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
            About Us
          </p>

          <h2 className="mt-6 text-4xl font-extrabold leading-tight md:text-6xl">
            Building student futures with{" "}
            <span className="text-[#D4AF37]">honest guidance.</span>
          </h2>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-gray-400">
            Zaifan Consultancy helps students explore international education
            opportunities with clarity, strategy and professional support.
          </p>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
            From university admissions to scholarships and visa preparation,
            we guide students through every important step.
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
            {features.map((feature, index) => (
              <div
                key={index}
                className="group flex items-center gap-5"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-2xl text-[#D4AF37] transition duration-300 group-hover:-translate-y-1">
                  ✓
                </div>

                <p className="text-xl leading-relaxed text-gray-300">
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default About;