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
      
      {/* Premium Background Glow */}
      <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-amber-300/10 blur-3xl"></div>

      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-yellow-100/5 blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="text-base md:text-lg uppercase tracking-[0.35em] font-semibold text-[#E7C768]/80">
            Services
          </span>

          <h2 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
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

        {/* Cards */}
        <div className="mt-20 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
          
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: index * 0.12,
              }}
              viewport={{ once: true }}
              whileHover={{
                y: -12,
                scale: 1.02,
              }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/30"
            >

              {/* Hover Glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent"></div>

              {/* Number */}
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-2xl font-bold text-[#E7C768]">
                0{index + 1}
              </div>

              {/* Title */}
              <h3 className="relative z-10 mt-8 text-2xl font-bold leading-snug">
                {service.title}
              </h3>

              {/* Text */}
              <p className="relative z-10 mt-5 leading-relaxed text-gray-400">
                {service.text}
              </p>

              {/* Bottom Accent */}
              <div className="relative z-10 mt-8 h-[2px] w-0 bg-[#D4AF37] transition-all duration-500 group-hover:w-full"></div>

            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Services;