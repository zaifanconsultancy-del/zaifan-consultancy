import { motion } from "framer-motion";

function Trust() {
  const items = [
    "Transparent consultation process",
    "Step-by-step student guidance",
    "Support from admission to visa",
    "Country recommendations",
  ];

  return (
    <section className="relative overflow-hidden bg-[#111111] px-5 py-24 text-white sm:px-6 md:py-28">
      <div className="absolute bottom-[-20%] left-[-20%] h-[420px] w-[420px] rounded-full bg-amber-200/10 blur-3xl"></div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, x: -35 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-200/70 md:text-lg">
            Why Choose Us
          </span>

          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-6xl">
            Honest guidance for students planning to{" "}
            <span className="text-[#D4AF37]">study abroad.</span>
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg">
            Zaifan Consultancy focuses on clarity, transparency and professional
            support for students aiming for international education.
          </p>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, x: 35 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75 }}
          viewport={{ once: true }}
          className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8 md:rounded-[2.5rem] md:p-10"
        >
          <div className="space-y-6 md:space-y-7">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="flex items-center gap-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-200/20 bg-amber-200/10 font-bold text-amber-200 md:h-12 md:w-12">
                  ✓
                </div>

                <p className="text-base leading-relaxed text-gray-300 sm:text-lg md:text-xl">
                  {item}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default Trust;