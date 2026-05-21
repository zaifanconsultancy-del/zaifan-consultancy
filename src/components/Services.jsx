import { motion } from "framer-motion";

function Services() {
  const services = [
    {
      title: "University Admissions",
      text: "Guidance for selecting universities and completing admission applications properly.",
    },
    {
      title: "Scholarship Assistance",
      text: "Helping students explore scholarship opportunities based on profile strength.",
    },
    {
      title: "Visa Guidance",
      text: "Complete support for visa preparation, financial documents and interviews.",
    },
    {
      title: "SOP & Documentation",
      text: "Professional guidance for SOPs, motivation letters and required paperwork.",
    },
  ];

  return (
    <section
      id="services"
      className="relative overflow-hidden bg-[#111111] py-32 px-6 text-white"
    >
      <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-amber-300/10 blur-3xl"></div>
      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-yellow-100/5 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="text-base font-semibold uppercase tracking-[0.35em] text-[#E7C768]/80 md:text-lg">
            Services
          </span>

          <h2 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Professional guidance for your{" "}
            <span className="text-[#D4AF37]">
              global education journey.
            </span>
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-gray-400">
            Zaifan Consultancy supports students throughout admissions,
            scholarships, documentation and visa preparation.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 70, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.75,
                delay: index * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              viewport={{ once: true, amount: 0.25 }}
              whileHover={{
                y: -12,
                scale: 1.025,
              }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/40 hover:bg-white/[0.06] hover:shadow-[0_25px_80px_rgba(212,175,55,0.12)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 via-transparent to-transparent opacity-0 transition duration-500 group-hover:from-[#D4AF37]/12 group-hover:opacity-100"></div>

              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[#D4AF37]/0 blur-2xl transition duration-500 group-hover:bg-[#D4AF37]/10"></div>

              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-2xl font-bold text-[#E7C768] transition duration-500 group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-black">
                0{index + 1}
              </div>

              <h3 className="relative z-10 mt-8 text-2xl font-bold leading-snug text-white">
                {service.title}
              </h3>

              <p className="relative z-10 mt-5 leading-relaxed text-gray-400">
                {service.text}
              </p>

              <div className="relative z-10 mt-8 h-[2px] w-0 bg-[#D4AF37] transition-all duration-500 group-hover:w-full"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;