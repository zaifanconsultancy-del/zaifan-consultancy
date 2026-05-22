import { motion } from "framer-motion";
import cameraPassport from "../assets/images/services/camera-passport.jpg";

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
      className="relative overflow-hidden bg-[#050505] px-6 py-32 text-white"
    >
      <div className="absolute right-[-10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
            Services
          </span>

          <h2 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">
            Professional guidance for your{" "}
            <span className="text-[#D4AF37]">global education journey.</span>
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-gray-400">
            Zaifan Consultancy supports students throughout admissions,
            scholarships, documentation and visa preparation.
          </p>
        </motion.div>

        <div className="relative mt-20 overflow-hidden rounded-[2.8rem] border border-[#D4AF37]/20 bg-white/[0.03] p-6 backdrop-blur-xl">
          <img
            src={cameraPassport}
            alt="Zaifan Consultancy services"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.08]"
          />

          <div className="absolute inset-0 bg-[#050505]/80"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/8 via-transparent to-transparent"></div>

          <div className="relative z-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 55 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/45 hover:bg-white/[0.06] hover:shadow-[0_25px_80px_rgba(212,175,55,0.10)]"
              >
                <div className="absolute inset-x-0 top-0 h-[2px] scale-x-0 bg-[#D4AF37] transition duration-500 group-hover:scale-x-100"></div>

                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-2xl font-bold text-[#E7C768]">
                  0{index + 1}
                </div>

                <h3 className="relative z-10 mt-8 text-2xl font-bold leading-snug">
                  {service.title}
                </h3>

                <p className="relative z-10 mt-5 leading-relaxed text-gray-400">
                  {service.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Services;