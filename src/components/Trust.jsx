import { motion } from "framer-motion";

function Trust() {
  const items = [
    "Transparent consultation process",
    "Step-by-step student guidance",
    "Support from admission to visa",
    "Profile-based country recommendations",
  ];

  return (
    <section className="relative overflow-hidden bg-[#111111] py-28 px-6 text-white">
      
      {/* Glow */}
      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-amber-200/10 blur-3xl"></div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">

        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            Why Choose Us
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Honest guidance for students planning to study abroad.
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-gray-400">
            Zaifan Consultancy focuses on clarity, transparency and professional support for students aiming for international education.
          </p>
        </motion.div>

        {/* Right */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-10 backdrop-blur-xl"
        >
          <div className="space-y-7">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
                className="group flex items-center gap-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/20 bg-amber-200/10 text-amber-200 font-bold transition duration-300 group-hover:scale-110">
                  ✓
                </div>

                <p className="text-lg text-gray-300">
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