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
      className="relative overflow-hidden bg-[#050505] px-6 py-28 text-white"
    >
      {/* BACKGROUND BLOBS */}
      <div className="absolute top-[-15%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        {/* TOP SECTION */}
        <div className="grid items-center gap-20 lg:grid-cols-2">
          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
              Services
            </p>

            <h2 className="mt-6 text-4xl font-extrabold leading-tight md:text-6xl">
              Professional guidance for your{" "}
              <span className="text-[#D4AF37]">
                global education journey.
              </span>
            </h2>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-gray-400">
              Zaifan Consultancy supports students throughout admissions,
              scholarships, documentation and visa preparation.
            </p>

            {/* SMALL FEATURE CARD */}
            <div className="mt-10 inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                ✓
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#D4AF37]">
                  Trusted Support
                </p>

                <p className="mt-1 text-gray-300">
                  Shortlisted guidance for Turkey TR universities.
                </p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[3rem] bg-[#D4AF37]/10 blur-3xl"></div>

            <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.03] p-2 shadow-2xl shadow-black/60">
              <div className="relative h-[520px] overflow-hidden rounded-[1.6rem]">
                <img
                  src={cameraPassport}
                  alt="Zaifan Consultancy services"
                  className="h-full w-full object-cover brightness-[0.75] contrast-110 transition duration-700 hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/35 to-transparent"></div>

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
                    Student Journey
                  </p>

                  <h3 className="mt-4 max-w-md text-3xl font-bold leading-tight">
                    Professional assistance from university selection to visa
                    success.
                  </h3>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* SERVICES CARDS */}
        <div className="relative mt-24 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 55 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: index * 0.08 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055] hover:shadow-[0_25px_80px_rgba(212,175,55,0.10)]"
            >
              {/* TOP GOLD STRIP */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100"></div>

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
    </section>
  );
}

export default Services;