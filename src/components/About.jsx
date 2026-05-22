import { motion } from "framer-motion";
import aboutDocuments from "../assets/images/about/about-documents.jpg";

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
      {/* BACKGROUND BLOBS */}
      <div className="absolute top-[-15%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-20 lg:grid-cols-2">
        {/* LEFT CONTENT */}
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

          {/* FEATURES */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition duration-300 hover:border-[#D4AF37]/30 hover:bg-white/[0.06]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                  ✓
                </div>

                <p className="text-base leading-relaxed text-gray-300">
                  {feature}
                </p>
              </div>
            ))}
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
                src={aboutDocuments}
                alt="Zaifan Consultancy student document guidance"
                className="h-full w-full object-cover brightness-[0.75] contrast-110 transition duration-700 hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/35 to-transparent"></div>

              <div className="absolute bottom-0 left-0 right-0 p-8">
                <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
                  Guided Process
                </p>

                <h3 className="mt-4 max-w-md text-3xl font-bold leading-tight">
                  Professional support from profile review to final visa
                  preparation.
                </h3>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default About;