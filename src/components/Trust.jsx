import { motion } from "framer-motion";
import office from "../assets/images/trust/office.jpg";

function Trust() {
  const points = [
    "Student-focused consultancy approach",
    "Clear and transparent guidance",
    "Support throughout application journey",
    "Professional help for admissions and visas",
  ];

  return (
    <section className="relative overflow-hidden bg-[#050505] px-6 py-28 text-white">
      {/* BACKGROUND BLOBS */}
      <div className="absolute top-[-15%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-20 lg:grid-cols-2">
        {/* LEFT IMAGE */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2rem] bg-white/[0.03] p-2 shadow-2xl shadow-black/60"
        >
          <div className="relative h-[560px] overflow-hidden rounded-[1.6rem]">
            <img
              src={office}
              alt="Zaifan Consultancy premium office"
              className="h-full w-full object-cover brightness-[0.8] contrast-110 transition duration-700 hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/25 to-transparent"></div>

            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
                Trusted Guidance
              </p>

              <h3 className="mt-4 max-w-md text-3xl font-bold leading-tight">
                Professional consultancy focused on student success and clarity.
              </h3>
            </div>
          </div>
        </motion.div>

        {/* RIGHT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85 }}
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

          {/* POINTS */}
          <div className="mt-12 grid gap-5">
            {points.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
                className="group flex items-start gap-5 rounded-2xl bg-white/[0.04] p-5 backdrop-blur-xl transition duration-300 hover:bg-white/[0.06]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-lg font-bold text-[#D4AF37] transition duration-300 group-hover:bg-[#D4AF37] group-hover:text-black">
                  ✓
                </div>

                <p className="pt-1 text-lg leading-relaxed text-gray-300">
                  {point}
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